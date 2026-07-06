import { describe, expect, it } from "vitest";

import {
  addStoicEventsToRehabDay,
  clampStoicDay,
  getStoicExerciseByDay,
  getStoicExercisesForDate,
  getStoicProgramDayIndex,
  getStoicWeekSummary,
  injectStoicPathEventsForRange,
  mergeStoicPathIntoTodayEvents,
  STOIC_PATH_PLAN_EVENT_ID_PREFIX,
} from "@/lib/rehab/stoic-rehab-utils";
import { filterUpcomingEventsBySearch } from "@/lib/rehab/rehab-upcoming-utils";
import { rehabTodaySectionForEvent } from "@/lib/rehab/rehab-today-utils";
import { STOIC_INTENTION_TITLE } from "@/modules/rehab/neuro-rehab-2026/stoic-content";
import { PROGRAM_START } from "@/modules/rehab/neuro-rehab-2026/constants";
import type { StoicRehabCompletion } from "@/types/stoic-rehab";
import type { RehabPlanEvent } from "@/types/rehab";

describe("getStoicProgramDayIndex", () => {
  it("returns day 1 on program start", () => {
    expect(getStoicProgramDayIndex(PROGRAM_START, PROGRAM_START)).toBe(1);
  });

  it("clamps before start to day 1", () => {
    expect(
      getStoicProgramDayIndex(PROGRAM_START, new Date(2026, 5, 10)),
    ).toBe(1);
  });

  it("clamps after day 84 to day 84", () => {
    expect(
      getStoicProgramDayIndex(PROGRAM_START, new Date(2026, 8, 15)),
    ).toBe(84);
  });
});

describe("clampStoicDay", () => {
  it("clamps values to 1–84", () => {
    expect(clampStoicDay(0)).toBe(1);
    expect(clampStoicDay(-5)).toBe(1);
    expect(clampStoicDay(85)).toBe(84);
    expect(clampStoicDay(200)).toBe(84);
    expect(clampStoicDay(42)).toBe(42);
  });
});

describe("getStoicExerciseByDay", () => {
  it("returns integrated checklist titles for day 1", () => {
    expect(getStoicExerciseByDay(1).title).toBe(
      "Midday Stoic Challenge · One Calm Rep",
    );
    expect(getStoicExerciseByDay(1).contentTitle).toBe("One Calm Rep");
    expect(getStoicExerciseByDay(1).virtue).toBe("wisdom");
    expect(getStoicExerciseByDay(1, "morning").title).toBe(
      "Morning Stoic Intention · Two Lists",
    );
  });

  it("returns week 1 closing day on day 7", () => {
    expect(getStoicExerciseByDay(7).dayTheme).toBe(
      "Acceptance Without Passivity",
    );
    expect(getStoicExerciseByDay(7).week).toBe(1);
    expect(getStoicExerciseByDay(7, "evening").contentTitle).toBe(
      "Week One Review",
    );
  });

  it("returns closing review for day 84", () => {
    expect(getStoicExerciseByDay(84, "evening").contentTitle).toBe(
      "The Final Review",
    );
    expect(getStoicExerciseByDay(84).week).toBe(12);
  });
});

describe("getStoicExercisesForDate", () => {
  it("maps program start to three daily slots", () => {
    const exercises = getStoicExercisesForDate(PROGRAM_START, PROGRAM_START);
    expect(exercises).toHaveLength(3);
    expect(exercises.map((exercise) => exercise.slot)).toEqual([
      "morning",
      "midday",
      "evening",
    ]);
    expect(exercises[0]?.title).toContain("Morning Stoic Intention");
    expect(exercises[1]?.title).toContain("Midday Stoic Challenge");
    expect(exercises[2]?.title).toContain("Evening Stoic Review");
  });
});

describe("injectStoicPathEventsForRange", () => {
  it("does not duplicate stoic events when injected twice", () => {
    const once = injectStoicPathEventsForRange(
      [],
      PROGRAM_START,
      PROGRAM_START,
      [],
    );
    const twice = injectStoicPathEventsForRange(
      once,
      PROGRAM_START,
      PROGRAM_START,
      [],
    );
    const stoicEvents = twice.filter((event) =>
      event.id.startsWith(STOIC_PATH_PLAN_EVENT_ID_PREFIX),
    );
    expect(stoicEvents).toHaveLength(3);
  });

  it("places morning, midday, and evening stoic events in correct sections", () => {
    const injected = injectStoicPathEventsForRange(
      [],
      PROGRAM_START,
      PROGRAM_START,
      [],
    );
    const stoicEvents = injected
      .filter((event) => event.id.startsWith(STOIC_PATH_PLAN_EVENT_ID_PREFIX))
      .sort(
        (a, b) =>
          new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      );
    expect(stoicEvents).toHaveLength(3);
    const sections = stoicEvents.map((event) => rehabTodaySectionForEvent(event));
    expect(sections).toEqual(["morning", "afternoon", "evening"]);
  });

  it("is searchable by midday practice content", () => {
    const injected = injectStoicPathEventsForRange(
      [],
      PROGRAM_START,
      PROGRAM_START,
      [],
    );
    const results = filterUpcomingEventsBySearch(injected, "one calm rep");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(
      results.some((event) => event.title.includes("Midday Stoic Challenge")),
    ).toBe(true);
  });
});

describe("addStoicEventsToRehabDay", () => {
  it("adds three stoic events to an existing day list", () => {
    const merged = addStoicEventsToRehabDay([], PROGRAM_START, []);
    expect(merged).toHaveLength(3);
    expect(merged.every((event) => event.eventKind === "stoic")).toBe(true);
  });
});

describe("getStoicWeekSummary", () => {
  it("aggregates virtue scores from tagged completions", () => {
    const completions: StoicRehabCompletion[] = [
      {
        id: "1",
        userId: "user",
        exerciseId: "stoic-day-01-evening",
        completedAt: "2026-06-14T10:00:00.000Z",
        processScore: 3,
        journalText: "Focused on next action.",
      },
      {
        id: "2",
        userId: "user",
        exerciseId: "stoic-day-02-evening",
        completedAt: "2026-06-15T10:00:00.000Z",
        processScore: 2,
      },
    ];

    const summary = getStoicWeekSummary(1, completions);
    expect(summary.daysCompleted).toBe(0);
    expect(summary.averageProcessScore).toBe(2.5);
    expect(summary.journalEntries).toHaveLength(2);
  });
});

describe("mergeStoicPathIntoTodayEvents", () => {
  it("replaces legacy Stoic intention with three integrated stoic tasks", () => {
    const legacy: RehabPlanEvent = {
      id: "legacy-stoic",
      userId: "u",
      title: STOIC_INTENTION_TITLE,
      description: null,
      startAt: PROGRAM_START.toISOString(),
      endAt: PROGRAM_START.toISOString(),
      allDay: false,
      color: "purple",
      createdAt: PROGRAM_START.toISOString(),
      updatedAt: PROGRAM_START.toISOString(),
      completedAt: null,
      eventKind: "stoic",
      programId: "neuro-rehab-2026-v1",
      planWeek: 1,
      speechRecordings: [],
      seriesId: "legacy-stoic",
      recurrence: null,
      recurrenceAt: PROGRAM_START.toISOString(),
      recurrenceCancelled: false,
    };

    const merged = mergeStoicPathIntoTodayEvents(
      [legacy],
      PROGRAM_START,
      [],
    );

    expect(merged.some((event) => event.title === STOIC_INTENTION_TITLE)).toBe(
      false,
    );
    const pathEvents = merged.filter((event) =>
      event.id.startsWith(STOIC_PATH_PLAN_EVENT_ID_PREFIX),
    );
    expect(pathEvents).toHaveLength(3);
    expect(pathEvents[0]?.title).toContain("Morning Stoic Intention");
  });
});
