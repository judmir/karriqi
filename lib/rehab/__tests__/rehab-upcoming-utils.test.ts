import { addDays, startOfDay } from "date-fns";
import { describe, expect, it } from "vitest";

import {
  buildUpcomingListSections,
  filterUpcomingEventsBySearch,
  hasMoreUpcomingDays,
  maxUpcomingDaysFrom,
  nextUpcomingVisibleDays,
  upcomingEventScheduleLabel,
  UPCOMING_DAYS_CHUNK,
  UPCOMING_INITIAL_DAYS,
  upcomingDayLabel,
} from "@/lib/rehab/rehab-upcoming-utils";
import { generateNeuroRehabProgramEvents } from "@/modules/rehab/neuro-rehab-2026/generate-program-events";
import { mapRehabPlanEvent } from "@/lib/rehab/rehab-plan-event-map";

function mapGenerated(userId = "u") {
  return generateNeuroRehabProgramEvents(userId).map((row, i) =>
    mapRehabPlanEvent({
      id: `id-${i}`,
      user_id: userId,
      title: row.title,
      description: row.description ?? null,
      start_at: row.start_at,
      end_at: row.end_at,
      all_day: row.all_day ?? false,
      color: row.color ?? "blue",
      completed_at: null,
      event_kind: row.event_kind,
      program_id: row.program_id,
      plan_week: row.plan_week,
      series_id: null,
      recurrence_rule: null,
      recurrence_at: null,
      recurrence_cancelled: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  );
}

describe("buildUpcomingListSections", () => {
  const today = startOfDay(new Date(2026, 5, 1));

  it("labels today, tomorrow and yesterday", () => {
    expect(upcomingDayLabel(today, today)).toBe("Today 1 Jun");
    expect(upcomingDayLabel(addDays(today, 1), today)).toBe("Tomorrow 2 Jun");
    expect(upcomingDayLabel(addDays(today, -1), today)).toBe("Yesterday 31 May");
    expect(upcomingDayLabel(addDays(today, 2), today)).toBe("Wed 3 Jun");
  });

  it("shows two weeks of future day rows initially", () => {
    const events = mapGenerated();
    const sections = buildUpcomingListSections(
      events,
      today,
      UPCOMING_INITIAL_DAYS,
    );

    const futureSections = sections.filter((section) => !section.isPast);
    expect(futureSections).toHaveLength(UPCOMING_INITIAL_DAYS);
  });

  it("adds two more weeks on each see more step", () => {
    const afterOne = nextUpcomingVisibleDays(
      UPCOMING_INITIAL_DAYS,
      today,
      mapGenerated(),
    );
    expect(afterOne).toBe(UPCOMING_INITIAL_DAYS + UPCOMING_DAYS_CHUNK);

    const events = mapGenerated();
    const sections = buildUpcomingListSections(events, today, afterOne);
    const futureSections = sections.filter((section) => !section.isPast);
    expect(futureSections).toHaveLength(afterOne);
  });

  it("caps at program end from stored events", () => {
    const events = mapGenerated();
    const maxDays = maxUpcomingDaysFrom(today, events);
    expect(hasMoreUpcomingDays(maxDays - 1, today, events)).toBe(true);
    expect(hasMoreUpcomingDays(maxDays, today, events)).toBe(false);
    expect(nextUpcomingVisibleDays(maxDays - 1, today, events)).toBe(maxDays);
  });

  it("renders past program days as their own past sections", () => {
    const events = mapGenerated();
    const sections = buildUpcomingListSections(events, addDays(today, 30));
    const pastSections = sections.filter((section) => section.isPast);
    expect(pastSections.length).toBeGreaterThan(0);
    // Past sections only include days that actually carry events.
    expect(pastSections.every((section) => section.events.length > 0)).toBe(
      true,
    );
    // Past sections come before today/future sections.
    const firstFutureIndex = sections.findIndex((section) => !section.isPast);
    expect(
      sections.slice(0, firstFutureIndex).every((section) => section.isPast),
    ).toBe(true);
  });

  it("keeps completed events visible in their day section", () => {
    const events = mapGenerated();
    const target = events.find((event) =>
      event.startAt.startsWith("2026-06-14"),
    );
    expect(target).toBeDefined();

    const completed = {
      ...target!,
      completedAt: "2026-06-14T10:00:00.000Z",
    };
    const sections = buildUpcomingListSections(
      events.map((event) => (event.id === completed.id ? completed : event)),
      new Date(2026, 5, 14),
    );
    const todaySection = sections.find(
      (section) => section.kind === "day" && section.label === "Today 14 Jun",
    );

    expect(
      todaySection?.events.some((event) => event.id === completed.id),
    ).toBe(true);
  });
});

describe("filterUpcomingEventsBySearch", () => {
  const today = startOfDay(new Date(2026, 5, 1));

  it("matches title and description across all events", () => {
    const events = mapGenerated();
    const custom = {
      ...events[0]!,
      id: "custom-1",
      title: "Physio follow-up",
      description: "Ask about ankle",
      eventKind: "custom" as const,
      programId: null,
      startAt: "2026-06-05T08:00:00.000Z",
      endAt: "2026-06-05T09:00:00.000Z",
      completedAt: null,
    };

    expect(
      filterUpcomingEventsBySearch([...events, custom], "physio").map(
        (event) => event.id,
      ),
    ).toEqual(["custom-1"]);
    expect(
      filterUpcomingEventsBySearch([...events, custom], "ankle").map(
        (event) => event.id,
      ),
    ).toEqual(["custom-1"]);
  });

  it("includes completed events", () => {
    const event = {
      ...mapGenerated()[0]!,
      id: "done-1",
      title: "Stretch routine",
      completedAt: new Date().toISOString(),
    };
    expect(filterUpcomingEventsBySearch([event], "stretch")).toHaveLength(1);
  });
});

describe("upcomingEventScheduleLabel", () => {
  it("shows date and time", () => {
    const event = {
      ...mapGenerated()[0]!,
      startAt: "2026-06-05T08:00:00.000Z",
      endAt: "2026-06-05T09:00:00.000Z",
      allDay: false,
      completedAt: null,
    };
    expect(
      upcomingEventScheduleLabel(event, startOfDay(new Date(2026, 5, 1))),
    ).toMatch(/5 Jun/);
  });
});
