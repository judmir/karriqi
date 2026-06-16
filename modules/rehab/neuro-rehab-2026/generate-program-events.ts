import { addDays, addMinutes } from "date-fns";

import { calendarDateToStorage } from "@/lib/calendar/all-day-events";
import {
  serializeRecurrenceRule,
  type RecurrenceRule,
} from "@/lib/rehab/recurrence";
import {
  NEURO_REHAB_PROGRAM_ID,
  PROGRAM_EXTRA_DAYS,
  PROGRAM_START,
  PROGRAM_WEEKS,
  SPEECH_PRACTICE_DURATION_MIN,
  SPEECH_PRACTICE_HOUR,
  SPEECH_PRACTICE_MINUTE,
  isRetestWeek,
} from "@/modules/rehab/neuro-rehab-2026/constants";
import {
  STOIC_BLOCKS,
  STOIC_INTENTION_TITLE,
  STOIC_WEEKLY_REVIEW_TITLE,
  buildStoicDailyDescription,
  buildStoicWeeklyDescription,
} from "@/modules/rehab/neuro-rehab-2026/stoic-content";
import { buildDay0EventDescription } from "@/modules/rehab/neuro-rehab-2026/day0-checklist";
import {
  GYM_A_DESCRIPTION,
  GYM_B_DESCRIPTION,
  GYM_C_DESCRIPTION,
  GYM_D_DESCRIPTION,
  HAND_OT_DESCRIPTION,
  RETEST_DESCRIPTION,
  SPEECH_DESCRIPTION,
  WEEKLY_REVIEW_DESCRIPTION,
  footballDescriptionForWeek,
} from "@/modules/rehab/neuro-rehab-2026/gym-templates";
import { runWalkPlanForWeek } from "@/modules/rehab/neuro-rehab-2026/run-walk-progression";
import { RUN_EVENT_TITLE, weekdayTemplate } from "@/modules/rehab/neuro-rehab-2026/weekly-template";
import type { CalendarEventColor } from "@/types/calendar";
import type { RehabEventKind, RehabPlanEventInsert } from "@/types/rehab";

function atTime(day: Date, hour: number, minute = 0): Date {
  const d = new Date(day);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function timed(
  userId: string,
  day: Date,
  week: number,
  hour: number,
  minute: number,
  durationMin: number,
  title: string,
  description: string | null,
  eventKind: RehabEventKind,
  color: CalendarEventColor,
): RehabPlanEventInsert {
  const start = atTime(day, hour, minute);
  const end = addMinutes(start, durationMin);
  return {
    // Every row carries an explicit id: a batch insert mixing rows with and
    // without `id` makes PostgREST send NULL (not the column default) for the
    // ones that omit it, violating the not-null id constraint.
    id: crypto.randomUUID(),
    user_id: userId,
    title,
    description,
    start_at: start.toISOString(),
    end_at: end.toISOString(),
    all_day: false,
    color,
    event_kind: eventKind,
    program_id: NEURO_REHAB_PROGRAM_ID,
    plan_week: week,
  };
}

function allDay(
  userId: string,
  day: Date,
  week: number,
  title: string,
  description: string | null,
  eventKind: RehabEventKind,
  color: CalendarEventColor,
): RehabPlanEventInsert {
  const startDay = new Date(day);
  startDay.setHours(0, 0, 0, 0);
  return {
    id: crypto.randomUUID(),
    user_id: userId,
    title,
    description,
    start_at: calendarDateToStorage(startDay),
    end_at: calendarDateToStorage(addDays(startDay, 1)),
    all_day: true,
    color,
    event_kind: eventKind,
    program_id: NEURO_REHAB_PROGRAM_ID,
    plan_week: week,
  };
}

/** Local YYYY-MM-DD (recurrence `until` is a date-only string). */
function toDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * A recurring master row: id === series_id so per-occurrence overrides
 * (completion / skip / edit) group correctly. The recurrence rule expands into
 * concrete occurrences at read time (see lib/rehab/expand-rehab-events.ts), so a
 * single row covers many days instead of materializing one row per day.
 */
function recurringMaster(
  userId: string,
  day: Date,
  week: number,
  hour: number,
  minute: number,
  durationMin: number,
  title: string,
  description: string,
  eventKind: RehabEventKind,
  color: CalendarEventColor,
  rule: RecurrenceRule,
): RehabPlanEventInsert {
  const start = atTime(day, hour, minute);
  const end = addMinutes(start, durationMin);
  const id = crypto.randomUUID();
  return {
    id,
    user_id: userId,
    title,
    description,
    start_at: start.toISOString(),
    end_at: end.toISOString(),
    all_day: false,
    color,
    event_kind: eventKind,
    program_id: NEURO_REHAB_PROGRAM_ID,
    plan_week: week,
    series_id: id,
    recurrence_rule: serializeRecurrenceRule(rule),
    recurrence_at: null,
  };
}

/**
 * Stoicism layer: a daily morning intention (one recurring master per 2-week
 * block so the theme evolves) plus a weekly Sunday Stoic review. Delivered as
 * recurring series rather than ~90 standalone rows.
 */
function stoicSeriesEvents(userId: string): RehabPlanEventInsert[] {
  const events: RehabPlanEventInsert[] = [];

  for (const block of STOIC_BLOCKS) {
    const startOffset = (block.startWeek - 1) * 7;
    const blockStart = addDays(PROGRAM_START, startOffset);
    const blockEnd = addDays(blockStart, 13); // inclusive 14-day block
    events.push(
      recurringMaster(
        userId,
        blockStart,
        block.startWeek,
        6,
        0,
        5,
        STOIC_INTENTION_TITLE,
        buildStoicDailyDescription(block),
        "stoic",
        "purple",
        { freq: "daily", interval: 1, until: toDateOnly(blockEnd) },
      ),
    );
  }

  // Weekly Sunday Stoic review, starting the first Sunday of the program.
  const firstSundayOffset = (7 - PROGRAM_START.getDay()) % 7;
  const firstSunday = addDays(PROGRAM_START, firstSundayOffset);
  const programEnd = addDays(PROGRAM_START, PROGRAM_WEEKS * 7 + PROGRAM_EXTRA_DAYS - 1);
  events.push(
    recurringMaster(
      userId,
      firstSunday,
      1,
      19,
      30,
      10,
      STOIC_WEEKLY_REVIEW_TITLE,
      buildStoicWeeklyDescription(),
      "stoic",
      "purple",
      {
        freq: "weekly",
        interval: 1,
        weekdays: [0],
        until: toDateOnly(programEnd),
      },
    ),
  );

  return events;
}

function gymDescription(kind: RehabEventKind): string {
  switch (kind) {
    case "gym_a":
      return GYM_A_DESCRIPTION;
    case "gym_b":
      return GYM_B_DESCRIPTION;
    case "gym_c":
      return GYM_C_DESCRIPTION;
    case "gym_d":
      return GYM_D_DESCRIPTION;
    default:
      return "";
  }
}

function mainSessionForDay(
  userId: string,
  day: Date,
  week: number,
  dayOfWeek: number,
  isRetest: boolean,
): RehabPlanEventInsert[] {
  const template = weekdayTemplate(dayOfWeek, week, isRetest);
  const events: RehabPlanEventInsert[] = [];

  // Sunday: easy walk + weekly review (+ retest videos on retest weeks).
  if (dayOfWeek === 0) {
    events.push(
      allDay(
        userId,
        day,
        week,
        "Weekly review",
        WEEKLY_REVIEW_DESCRIPTION,
        "weekly_review",
        "purple",
      ),
    );
    if (isRetest) {
      events.push(
        timed(
          userId,
          day,
          week,
          11,
          0,
          60,
          "Retest videos",
          RETEST_DESCRIPTION,
          "retest",
          "orange",
        ),
      );
    }
  }

  const { mainKind, mainTitle } = template;
  let description = template.mainDescription;
  let duration = isRetest ? 36 : 60;

  if (mainKind === "gym_a" || mainKind === "gym_b" || mainKind === "gym_c" || mainKind === "gym_d") {
    description = gymDescription(mainKind);
    if (isRetest) {
      description = `(Deload ~20%)\n\n${description}`;
    }
  } else if (mainKind === "run_walk") {
    const plan = runWalkPlanForWeek(week);
    if (template.isSundayEasyWalk) {
      description =
        "Sunday easy walk only — light mobility, no jogging pressure.\n\nComplete weekly review.";
      duration = isRetest ? 25 : 30;
    } else {
      description = plan.description;
      duration = isRetest ? 30 : 45;
    }
  } else if (mainKind === "recovery") {
    duration = 30;
  }

  events.push(
    timed(
      userId,
      day,
      week,
      template.mainStartHour,
      template.mainStartMinute,
      duration,
      mainKind === "run_walk" ? RUN_EVENT_TITLE : mainTitle,
      description.trim() || null,
      mainKind,
      mainKind === "run_walk" ? "green" : mainKind === "recovery" ? "green" : "blue",
    ),
  );

  if (template.handMinutes > 0) {
    events.push(
      timed(
        userId,
        day,
        week,
        15,
        0,
        template.handMinutes,
        `Left-hand / OT (${template.handMinutes} min)`,
        HAND_OT_DESCRIPTION,
        "hand",
        "orange",
      ),
    );
  }

  if (template.includeFootball) {
    events.push(
      timed(
        userId,
        day,
        week,
        17,
        0,
        20,
        "Football / ball control",
        footballDescriptionForWeek(week),
        "football",
        "purple",
      ),
    );
  }

  if (template.includeEasyWalk) {
    events.push(
      timed(
        userId,
        day,
        week,
        17,
        0,
        20,
        RUN_EVENT_TITLE,
        "Saturday easy walk — light, no jogging pressure.",
        "run_walk",
        "green",
      ),
    );
  }

  return events;
}

function dailyNonNegotiables(
  userId: string,
  day: Date,
  week: number,
  isFirstDay: boolean,
): RehabPlanEventInsert[] {
  const events: RehabPlanEventInsert[] = [
    timed(
      userId,
      day,
      week,
      8,
      30,
      5,
      "Vitamin D (with breakfast)",
      "Take with breakfast if agreed with doctor. See Wiki: Supplements.",
      "supplement",
      "blue",
    ),
    timed(
      userId,
      day,
      week,
      SPEECH_PRACTICE_HOUR,
      SPEECH_PRACTICE_MINUTE,
      SPEECH_PRACTICE_DURATION_MIN,
      "Speech practice",
      SPEECH_DESCRIPTION,
      "speech",
      "red",
    ),
    timed(
      userId,
      day,
      week,
      7,
      30,
      10,
      "Waking Up meditation",
      week <= 4
        ? "Introductory course or daily meditation, 5–10 min."
        : week <= 8
          ? "Daily meditation, 10 min. Optional theory 1–2×/week."
          : "Daily meditation 10 min. Short session before hard rehab days if stress is high.",
      "meditation",
      "purple",
    ),
    timed(
      userId,
      day,
      week,
      12,
      0,
      5,
      "Omega-3 + posture reset",
      "Omega-3 with lunch if taking. 2 min posture/breath reset.",
      "supplement",
      "blue",
    ),
    timed(
      userId,
      day,
      week,
      21,
      0,
      5,
      "Journal (5 min)",
      null,
      "journal",
      "red",
    ),
    timed(
      userId,
      day,
      week,
      21,
      30,
      5,
      "Magnesium (evening)",
      "Evening/night if tolerated. See Wiki: Supplements.",
      "supplement",
      "blue",
    ),
  ];

  if (isFirstDay) {
    events.unshift(
      allDay(
        userId,
        day,
        week,
        "Day 0 checklist",
        buildDay0EventDescription(),
        "day0",
        "orange",
      ),
    );
  }

  return events;
}

/** Generate 12 weeks of rehab calendar events for one user. */
export function generateNeuroRehabProgramEvents(userId: string): RehabPlanEventInsert[] {
  const events: RehabPlanEventInsert[] = [];

  // Stoicism layer: a handful of recurring masters (not one row per day).
  events.push(...stoicSeriesEvents(userId));

  const totalDays = PROGRAM_WEEKS * 7 + PROGRAM_EXTRA_DAYS;

  for (let offset = 0; offset < totalDays; offset++) {
    const day = addDays(PROGRAM_START, offset);
    const week = Math.floor(offset / 7) + 1;
    const dayOfWeek = day.getDay();
    const isRetest = isRetestWeek(week);
    const isFirstDay = offset === 0;

    events.push(...dailyNonNegotiables(userId, day, week, isFirstDay));
    events.push(...mainSessionForDay(userId, day, week, dayOfWeek, isRetest));

    // Workout-day creatine reminder (Wed, Fri, Sat gym)
    if ([3, 5, 6].includes(dayOfWeek)) {
      events.push(
        timed(
          userId,
          day,
          week,
          8,
          45,
          5,
          "Creatine (workout day)",
          "With meal or around workout if agreed with doctor.",
          "supplement",
          "blue",
        ),
      );
    }
  }

  return events;
}

export function countEventsByWeekday(events: RehabPlanEventInsert[]): Record<number, number> {
  const counts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const tracked: RehabEventKind[] = ["gym_a", "gym_b", "gym_c", "gym_d", "run_walk"];
  for (const event of events) {
    if (tracked.includes(event.event_kind)) {
      const d = new Date(event.start_at).getDay();
      counts[d] = (counts[d] ?? 0) + 1;
    }
  }
  return counts;
}
