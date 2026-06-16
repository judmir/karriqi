import { addDays, startOfDay } from "date-fns";
import { describe, expect, it } from "vitest";

import {
  buildHistoryDaySections,
  hasMoreHistoryDays,
  historyDayLabel,
  maxHistoryDaysFrom,
  nextHistoryVisibleDays,
} from "@/lib/rehab/rehab-history-utils";
import { mapRehabPlanEvent } from "@/lib/rehab/rehab-plan-event-map";
import { PROGRAM_START } from "@/modules/rehab/neuro-rehab-2026/constants";
import type { RehabPlanEvent } from "@/types/rehab";

function eventOnDay(
  day: Date,
  title: string,
  completed = false,
): RehabPlanEvent {
  const start = new Date(day);
  start.setHours(10, 0, 0, 0);
  const end = new Date(day);
  end.setHours(10, 30, 0, 0);
  return mapRehabPlanEvent({
    id: `evt-${title}-${day.toISOString()}`,
    user_id: "u",
    title,
    description: null,
    start_at: start.toISOString(),
    end_at: end.toISOString(),
    all_day: false,
    color: "blue",
    completed_at: completed ? start.toISOString() : null,
    event_kind: "custom",
    program_id: null,
    plan_week: null,
    series_id: null,
    recurrence_rule: null,
    recurrence_at: null,
    recurrence_cancelled: false,
    created_at: start.toISOString(),
    updated_at: start.toISOString(),
  });
}

describe("buildHistoryDaySections", () => {
  const today = startOfDay(new Date(2026, 5, 22));

  it("labels yesterday", () => {
    const yesterday = addDays(today, -1);
    expect(historyDayLabel(yesterday, today)).toBe("Yesterday · 21 Jun");
  });

  it("groups past days newest first and counts completions", () => {
    const yesterday = addDays(today, -1);
    const twoDaysAgo = addDays(today, -2);
    const events = [
      eventOnDay(yesterday, "Walk", true),
      eventOnDay(yesterday, "Speech"),
      eventOnDay(twoDaysAgo, "Gym", true),
    ];

    const sections = buildHistoryDaySections(events, today, 14);
    expect(sections).toHaveLength(2);
    expect(sections[0]?.label).toContain("Yesterday");
    expect(sections[0]?.completedCount).toBe(1);
    expect(sections[0]?.events).toHaveLength(2);
    expect(sections[1]?.events).toHaveLength(1);
  });

  it("skips today and empty days", () => {
    const events = [eventOnDay(today, "Today task")];
    expect(buildHistoryDaySections(events, today, 7)).toHaveLength(0);
  });

  it("respects program start", () => {
    const beforeProgram = addDays(startOfDay(PROGRAM_START), -1);
    const events = [eventOnDay(beforeProgram, "Too early")];
    expect(buildHistoryDaySections(events, today, 30)).toHaveLength(0);
  });
});

describe("history pagination", () => {
  const today = startOfDay(new Date(2026, 5, 21));

  it("caps visible days at days since program start", () => {
    expect(maxHistoryDaysFrom(today)).toBe(7);
    expect(hasMoreHistoryDays(3, today)).toBe(true);
    expect(nextHistoryVisibleDays(3, today)).toBe(7);
    expect(hasMoreHistoryDays(7, today)).toBe(false);
  });
});
