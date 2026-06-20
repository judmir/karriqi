import { describe, expect, it } from "vitest";
import { addDays, startOfDay } from "date-fns";

import {
  NEURO_REHAB_PROGRAM_ID,
  PROGRAM_START,
  isRetestWeek,
} from "@/modules/rehab/neuro-rehab-2026/constants";
import { generateNeuroRehabProgramEvents } from "@/modules/rehab/neuro-rehab-2026/generate-program-events";
import { filterRehabEventsForDay } from "@/lib/rehab/rehab-today-utils";
import { mapRehabPlanEvent } from "@/lib/rehab/rehab-plan-event-map";
import { parseEventDescription } from "@/lib/calendar/event-subtasks";

describe("generateNeuroRehabProgramEvents", () => {
  const userId = "test-user";
  const events = generateNeuroRehabProgramEvents(userId);

  it("starts on Sunday 14 June 2026", () => {
    expect(PROGRAM_START.getDay()).toBe(0);
    expect(PROGRAM_START.getFullYear()).toBe(2026);
    expect(PROGRAM_START.getMonth()).toBe(5);
    expect(PROGRAM_START.getDate()).toBe(14);

    const first = events.find((e) => e.event_kind === "day0");
    expect(first).toBeDefined();
    expect(first?.description).toContain("karriqi-subtasks");
    const firstDay = startOfDay(new Date(first!.start_at));
    expect(firstDay.getTime()).toBe(startOfDay(PROGRAM_START).getTime());
  });

  it("generates 90 days of program events", () => {
    expect(events.length).toBeGreaterThan(400);
    expect(events.every((e) => e.program_id === NEURO_REHAB_PROGRAM_ID)).toBe(
      true,
    );
    expect(events.every((e) => e.user_id === userId)).toBe(true);
  });

  it("includes gym A on Wednesdays across 12 weeks + extra days", () => {
    const gymA = events.filter((e) => e.event_kind === "gym_a");
    expect(gymA.length).toBe(13);
    expect(gymA.every((e) => new Date(e.start_at).getDay() === 3)).toBe(true);
  });

  it("schedules gym on Wed/Fri/Sat and run/walk on Sun/Mon/Tue/Thu/Sat", () => {
    const gymKinds = new Set(["gym_a", "gym_b", "gym_c"]);
    const gymDays = new Set(
      events
        .filter((e) => gymKinds.has(e.event_kind))
        .map((e) => new Date(e.start_at).getDay()),
    );
    expect([...gymDays].sort()).toEqual([3, 5, 6]);

    const runDays = new Set(
      events
        .filter((e) => e.event_kind === "run_walk")
        .map((e) => new Date(e.start_at).getDay()),
    );
    expect([...runDays].sort()).toEqual([0, 1, 2, 4, 6]);
  });

  it("schedules Gym C on Friday at 18:00", () => {
    const gymC = events.filter((e) => e.event_kind === "gym_c");
    expect(gymC.length).toBeGreaterThan(0);
    expect(gymC.every((e) => new Date(e.start_at).getDay() === 5)).toBe(true);
    expect(gymC.every((e) => new Date(e.start_at).getHours() === 18)).toBe(
      true,
    );
  });

  it("stores gym exercises as checklist subtasks with reference links", () => {
    const gymA = events.find((e) => e.event_kind === "gym_a");
    expect(gymA?.description).toBeTruthy();

    const parsed = parseEventDescription(gymA?.description);
    expect(parsed.subtasks.length).toBeGreaterThan(5);
    expect(parsed.subtasks[0]?.label).toContain("Warm-up");
    expect(parsed.subtasks[0]?.referenceLabel).toBe("GIF");
    expect(parsed.subtasks[0]?.referenceUrl).toContain("tbm=isch");
  });

  it("keeps Gym C as gait/control day without heavy leg strength work", () => {
    const gymC = events.find((e) => e.event_kind === "gym_c");
    expect(gymC?.title).toContain("gait control");
    expect(gymC?.description).toContain("gait control");
    expect(gymC?.description).not.toContain("leg press");
    expect(gymC?.description).not.toContain("Romanian deadlift");

    const parsed = parseEventDescription(gymC?.description);
    expect(parsed.subtasks.some((s) => s.label.includes("Gait rhythm"))).toBe(
      true,
    );
  });

  it("flags retest weeks 4, 8, 12", () => {
    expect(isRetestWeek(4)).toBe(true);
    expect(isRetestWeek(8)).toBe(true);
    expect(isRetestWeek(12)).toBe(true);

    const retestEvents = events.filter((e) => e.event_kind === "retest");
    expect(retestEvents.length).toBe(3);
    expect(
      retestEvents
        .map((e) => e.plan_week)
        .filter((week): week is number => week != null)
        .sort((a, b) => a - b),
    ).toEqual([4, 8, 12]);
  });

  it("uses shorter gym sessions on retest weeks", () => {
    const week4GymA = events.find(
      (e) =>
        e.event_kind === "gym_a" &&
        e.plan_week === 4 &&
        new Date(e.start_at).getDay() === 3,
    );
    expect(week4GymA?.description).toContain("Deload");
    const start = new Date(week4GymA!.start_at);
    const end = new Date(week4GymA!.end_at);
    expect((end.getTime() - start.getTime()) / 60000).toBe(36);
  });

  it("schedules Vitamin D at 8:30 each morning", () => {
    const vitD = events.filter((e) => e.title === "Vitamin D (with breakfast)");
    expect(vitD.length).toBeGreaterThan(80);
    for (const event of vitD) {
      expect(event.all_day).toBe(false);
      const start = new Date(event.start_at);
      expect(start.getHours()).toBe(8);
      expect(start.getMinutes()).toBe(30);
    }
  });

  it("schedules speech practice daily at 09:55", () => {
    const speech = events.filter((e) => e.event_kind === "speech");
    expect(speech).toHaveLength(90);
    for (const event of speech) {
      const start = new Date(event.start_at);
      expect(start.getHours()).toBe(9);
      expect(start.getMinutes()).toBe(55);
      expect(event.title).toBe("Speech practice");
    }
  });

  it("delivers Stoicism as recurring masters, not one row per day", () => {
    const stoic = events.filter((e) => e.event_kind === "stoic");
    // 6 daily block masters (one per 2-week theme) + 1 weekly Sunday review.
    expect(stoic.length).toBe(7);

    // Every stoic row is a recurring master: own id === series_id, has a rule,
    // and is not a per-occurrence override.
    for (const event of stoic) {
      expect(event.id).toBeTruthy();
      expect(event.series_id).toBe(event.id);
      expect(event.recurrence_rule).toBeTruthy();
      expect(event.recurrence_at ?? null).toBeNull();
      expect(event.color).toBe("purple");
    }

    const dailyMasters = stoic.filter(
      (e) => e.recurrence_rule && JSON.parse(e.recurrence_rule).freq === "daily",
    );
    expect(dailyMasters.length).toBe(6);
    for (const event of dailyMasters) {
      const start = new Date(event.start_at);
      expect(start.getHours()).toBe(6);
      expect(start.getMinutes()).toBe(0);
    }

    const weeklyMasters = stoic.filter(
      (e) => e.recurrence_rule && JSON.parse(e.recurrence_rule).freq === "weekly",
    );
    expect(weeklyMasters.length).toBe(1);
    const weeklyRule = JSON.parse(weeklyMasters[0]!.recurrence_rule!);
    expect(weeklyRule.weekdays).toEqual([0]);
    // Weekly review starts on a Sunday.
    expect(new Date(weeklyMasters[0]!.start_at).getDay()).toBe(0);
  });

  it("spans through week 12 ending in September 2026", () => {
    const lastDay = addDays(PROGRAM_START, 12 * 7 - 1);
    expect(lastDay.getMonth()).toBe(8);
    const lastWeekEvents = events.filter((e) => e.plan_week === 12);
    expect(lastWeekEvents.length).toBeGreaterThan(0);
  });
});

describe("filterRehabEventsForDay", () => {
  it("returns only events for the given day", () => {
    const rows = generateNeuroRehabProgramEvents("u").slice(0, 20);
    const mapped = rows.map((row, i) =>
      mapRehabPlanEvent({
        id: `id-${i}`,
        user_id: "u",
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

    const day0 = filterRehabEventsForDay(mapped, PROGRAM_START);
    expect(day0.length).toBeGreaterThan(0);
    expect(day0.some((e) => e.eventKind === "day0")).toBe(true);
  });
});
