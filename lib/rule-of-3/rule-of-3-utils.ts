import {
  RULE_OF_3_POSITIONS,
  RULE_OF_3_SLOT_HINTS,
  RULE_OF_3_SLOT_LABELS,
  type RuleOf3Day,
  type RuleOf3Item,
  type RuleOf3ItemStatus,
  type RuleOf3Position,
  type RuleOf3Slot,
} from "@/types/rule-of-3";

/** Local-time date key (YYYY-MM-DD) — the calendar day as the user sees it. */
export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayDateString(now: Date = new Date()): string {
  return toDateString(now);
}

export function tomorrowDateString(now: Date = new Date()): string {
  const next = new Date(now);
  next.setDate(next.getDate() + 1);
  return toDateString(next);
}

/** IANA timezone for evening Rule of 3 reminders (matches planner copy / en-GB). */
export const RULE_OF_3_REMINDER_TIMEZONE = "Europe/London";

/** Calendar date (YYYY-MM-DD) for `date` in the given IANA timezone. */
export function dateStringInTimeZone(
  date: Date,
  timeZone: string = RULE_OF_3_REMINDER_TIMEZONE,
): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);
}

/** Next calendar day in the given IANA timezone (relative to `date`). */
export function tomorrowDateStringInTimeZone(
  date: Date = new Date(),
  timeZone: string = RULE_OF_3_REMINDER_TIMEZONE,
): string {
  return dateStringInTimeZone(
    new Date(date.getTime() + 24 * 60 * 60 * 1000),
    timeZone,
  );
}

/** Local hour (0–23) for `date` in the given IANA timezone. */
export function hourInTimeZone(
  date: Date,
  timeZone: string = RULE_OF_3_REMINDER_TIMEZONE,
): number {
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "numeric",
    hour12: false,
  }).format(date);
  return Number.parseInt(hour, 10);
}

/** Local minute (0–59) for `date` in the given IANA timezone. */
export function minuteInTimeZone(
  date: Date,
  timeZone: string = RULE_OF_3_REMINDER_TIMEZONE,
): number {
  const minute = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    minute: "numeric",
  }).format(date);
  return Number.parseInt(minute, 10);
}

/** True when `date` falls on the given local hour and minute in the timezone. */
export function isLocalTimeInTimeZone(
  date: Date,
  hour: number,
  minute: number,
  timeZone: string = RULE_OF_3_REMINDER_TIMEZONE,
): boolean {
  return (
    hourInTimeZone(date, timeZone) === hour &&
    minuteInTimeZone(date, timeZone) === minute
  );
}

/** True when all three tomorrow slots have a non-empty title. */
export function isTomorrowPlanningComplete(plannedCount: number): boolean {
  return plannedCount >= RULE_OF_3_POSITIONS.length;
}

export function isValidPosition(value: number): value is RuleOf3Position {
  return RULE_OF_3_POSITIONS.includes(value as RuleOf3Position);
}

export function itemId(planDate: string, position: RuleOf3Position): string {
  return `${planDate}#${position}`;
}

export function ruleOf3ItemStatus(item: RuleOf3Item | null): RuleOf3ItemStatus {
  if (!item) {
    return "open";
  }
  if (item.completedAt) {
    return "done";
  }
  if (item.blockedReason.trim().length > 0) {
    return "blocked";
  }
  return "open";
}

/** Always returns three slots (positions 1-3), filling empty positions. */
export function getDaySlots(day: RuleOf3Day | undefined): RuleOf3Slot[] {
  return RULE_OF_3_POSITIONS.map((position) => {
    const item = day?.items.find((entry) => entry.position === position) ?? null;
    return {
      position,
      label: RULE_OF_3_SLOT_LABELS[position],
      hint: RULE_OF_3_SLOT_HINTS[position],
      item: item && item.title.trim().length > 0 ? item : null,
    };
  });
}

export type RuleOf3DayProgress = {
  planned: number;
  done: number;
  blocked: number;
};

export function dayProgress(day: RuleOf3Day | undefined): RuleOf3DayProgress {
  const slots = getDaySlots(day);
  let planned = 0;
  let done = 0;
  let blocked = 0;
  for (const slot of slots) {
    if (!slot.item) {
      continue;
    }
    planned += 1;
    const status = ruleOf3ItemStatus(slot.item);
    if (status === "done") {
      done += 1;
    } else if (status === "blocked") {
      blocked += 1;
    }
  }
  return { planned, done, blocked };
}

/** Past days (strictly before `todayDate`) that have at least one planned item, newest first. */
export function historyDays(
  days: RuleOf3Day[],
  todayDate: string,
): RuleOf3Day[] {
  return days
    .filter((day) => day.planDate < todayDate && dayProgress(day).planned > 0)
    .sort((a, b) => (a.planDate < b.planDate ? 1 : -1));
}

export function findDay(
  days: RuleOf3Day[],
  planDate: string,
): RuleOf3Day | undefined {
  return days.find((day) => day.planDate === planDate);
}

export function emptyDay(planDate: string): RuleOf3Day {
  return {
    id: planDate,
    planDate,
    reflection: "",
    items: [],
    createdAt: null,
    updatedAt: null,
  };
}

/** Insert or replace an item at its position within the matching day (creating the day if missing). */
export function upsertItem(
  days: RuleOf3Day[],
  planDate: string,
  position: RuleOf3Position,
  patch: Partial<Omit<RuleOf3Item, "id" | "position">>,
): RuleOf3Day[] {
  const existingDay = findDay(days, planDate);
  const baseDay = existingDay ?? emptyDay(planDate);

  const existingItem = baseDay.items.find((entry) => entry.position === position);
  const nextItem: RuleOf3Item = {
    id: itemId(planDate, position),
    position,
    title: existingItem?.title ?? "",
    notes: existingItem?.notes ?? "",
    completedAt: existingItem?.completedAt ?? null,
    blockedReason: existingItem?.blockedReason ?? "",
    ...patch,
  };

  const nextItems = [
    ...baseDay.items.filter((entry) => entry.position !== position),
    nextItem,
  ].sort((a, b) => a.position - b.position);

  const nextDay: RuleOf3Day = { ...baseDay, items: nextItems };

  if (existingDay) {
    return days.map((day) => (day.planDate === planDate ? nextDay : day));
  }
  return [nextDay, ...days];
}
