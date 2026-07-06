import { addDays, startOfDay } from "date-fns";
import { describe, expect, it } from "vitest";

import {
  buildUpcomingListSections,
  filterUpcomingEventsBySearch,
  hasMoreUpcomingDays,
  maxFutureDaysAfterToday,
  nextUpcomingVisibleDays,
  formatUpcomingSearchResultsLabel,
  paginateUpcomingSearchItems,
  searchUpcomingItems,
  upcomingEventScheduleLabel,
  upcomingSearchSummaryLabel,
  UPCOMING_FUTURE_DAYS_CHUNK,
  UPCOMING_FUTURE_DAYS_INITIAL,
  UPCOMING_PAST_DAYS,
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

  it("shows today and tomorrow initially", () => {
    const events = mapGenerated();
    const sections = buildUpcomingListSections(
      events,
      today,
      UPCOMING_FUTURE_DAYS_INITIAL,
    );

    const futureSections = sections.filter((section) => !section.isPast);
    expect(futureSections).toHaveLength(UPCOMING_FUTURE_DAYS_INITIAL + 1);
  });

  it("adds three more future days on each see more step", () => {
    const afterOne = nextUpcomingVisibleDays(
      UPCOMING_FUTURE_DAYS_INITIAL,
      today,
      mapGenerated(),
    );
    expect(afterOne).toBe(
      UPCOMING_FUTURE_DAYS_INITIAL + UPCOMING_FUTURE_DAYS_CHUNK,
    );

    const events = mapGenerated();
    const sections = buildUpcomingListSections(events, today, afterOne);
    const futureSections = sections.filter((section) => !section.isPast);
    expect(futureSections).toHaveLength(afterOne + 1);
  });

  it("caps at program end from stored events", () => {
    const events = mapGenerated();
    const maxDays = maxFutureDaysAfterToday(today, events);
    expect(hasMoreUpcomingDays(maxDays - 1, today, events)).toBe(true);
    expect(hasMoreUpcomingDays(maxDays, today, events)).toBe(false);
    expect(nextUpcomingVisibleDays(maxDays - 1, today, events)).toBe(maxDays);
  });

  it("renders at most yesterday as the past day with events", () => {
    const events = mapGenerated();
    const sections = buildUpcomingListSections(events, addDays(today, 30));
    const pastSections = sections.filter((section) => section.isPast);
    expect(pastSections.length).toBeGreaterThan(0);
    expect(pastSections.length).toBeLessThanOrEqual(UPCOMING_PAST_DAYS);
    expect(pastSections.every((section) => section.events.length > 0)).toBe(
      true,
    );
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


describe("paginateUpcomingSearchItems", () => {
  it("returns a page with total and hasMore", () => {
    const events = mapGenerated().slice(0, 3).map((event, index) => ({
      kind: "event" as const,
      event: { ...event, id: `e-${index}` },
    }));
    const page = paginateUpcomingSearchItems(events, 0, 2);
    expect(page.items).toHaveLength(2);
    expect(page.total).toBe(3);
    expect(page.hasMore).toBe(true);

    const last = paginateUpcomingSearchItems(events, 2, 2);
    expect(last.items).toHaveLength(1);
    expect(last.hasMore).toBe(false);
  });
});

describe("formatUpcomingSearchResultsLabel", () => {
  it("formats partial and full counts with summary", () => {
    expect(
      formatUpcomingSearchResultsLabel({
        shown: 25,
        total: 733,
        summary: "Run",
      }),
    ).toBe("25 of 733 results · Run");
    expect(
      formatUpcomingSearchResultsLabel({
        shown: 733,
        total: 733,
        summary: "Run",
      }),
    ).toBe("733 results · Run");
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
    ).toContain("custom-1");
    expect(
      filterUpcomingEventsBySearch([...events, custom], "ankle").map(
        (event) => event.id,
      ),
    ).toContain("custom-1");
  });


  it("matches speech events when searching with filler words", () => {
    const events = mapGenerated();
    const speechEvents = events.filter((event) => event.eventKind === "speech");
    expect(speechEvents.length).toBeGreaterThan(0);

    const withFiller = new Set(
      filterUpcomingEventsBySearch(events, "speech events").map(
        (event) => event.id,
      ),
    );
    const plain = new Set(
      filterUpcomingEventsBySearch(events, "Speech").map((event) => event.id),
    );
    expect(speechEvents.every((event) => withFiller.has(event.id))).toBe(true);
    expect(speechEvents.every((event) => plain.has(event.id))).toBe(true);
  });

  it("includes speech recordings in search results", () => {
    const events = mapGenerated();
    const speech = events.find((event) => event.eventKind === "speech");
    expect(speech).toBeDefined();

    const withRecording = {
      ...speech!,
      speechRecordings: [
        {
          id: "rec-1",
          eventId: speech!.id,
          userId: "u",
          fileName: "speech-2026-06-05.webm",
          mimeType: "audio/webm",
          sizeBytes: 1200,
          durationSeconds: 42,
          storagePath: "u/event/rec-1.webm",
          note: "Clear articulation",
          createdAt: "2026-06-05T10:15:00.000Z",
        },
      ],
    };

    const allEvents = events.map((event) =>
      event.id === withRecording.id ? withRecording : event,
    );

    const speechSearch = searchUpcomingItems(allEvents, "speech");
    expect(
      speechSearch.some(
        (item) => item.kind === "recording" && item.recording.id === "rec-1",
      ),
    ).toBe(true);

    const noteSearch = searchUpcomingItems(allEvents, "articulation");
    expect(
      noteSearch.some(
        (item) => item.kind === "recording" && item.recording.id === "rec-1",
      ),
    ).toBe(true);
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


  it("filters by task type chips without text search", () => {
    const events = mapGenerated();
    const runEvents = events.filter((event) => event.eventKind === "run_walk");
    expect(runEvents.length).toBeGreaterThan(0);

    const results = searchUpcomingItems(events, { kindFilters: ["run"] });
    expect(results.every((item) => item.kind === "event")).toBe(true);
    expect(
      results.every((item) => item.event.eventKind === "run_walk"),
    ).toBe(true);
    expect(results).toHaveLength(runEvents.length);
  });

  it("combines kind filters with text search", () => {
    const events = mapGenerated();
    const speech = events.filter((event) => event.eventKind === "speech");
    expect(speech.length).toBeGreaterThan(0);

    const results = searchUpcomingItems(events, {
      kindFilters: ["speech"],
      query: "practice",
    });
    expect(results).toHaveLength(speech.length);
  });

  it("builds a readable search summary label", () => {
    expect(
      upcomingSearchSummaryLabel({
        kindFilters: ["run", "speech"],
        query: "morning",
      }),
    ).toBe('Run, Speech · “morning”');
    expect(upcomingSearchSummaryLabel({ kindFilters: ["run"] })).toBe("Run");
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
