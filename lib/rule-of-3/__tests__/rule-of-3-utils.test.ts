import { describe, expect, it } from "vitest";

import {
  dayProgress,
  emptyDay,
  getDaySlots,
  historyDays,
  isValidPosition,
  itemId,
  ruleOf3ItemStatus,
  toDateString,
  todayDateString,
  tomorrowDateString,
  upsertItem,
} from "@/lib/rule-of-3/rule-of-3-utils";
import type { RuleOf3Day } from "@/types/rule-of-3";

function makeDay(planDate: string, items: RuleOf3Day["items"]): RuleOf3Day {
  return {
    id: planDate,
    planDate,
    reflection: "",
    items,
    createdAt: null,
    updatedAt: null,
  };
}

describe("date helpers", () => {
  it("formats a local date as YYYY-MM-DD", () => {
    expect(toDateString(new Date(2026, 5, 4))).toBe("2026-06-04");
    expect(toDateString(new Date(2026, 0, 9))).toBe("2026-01-09");
  });

  it("derives today and tomorrow from a reference date", () => {
    const ref = new Date(2026, 11, 31, 23, 0, 0);
    expect(todayDateString(ref)).toBe("2026-12-31");
    expect(tomorrowDateString(ref)).toBe("2027-01-01");
  });
});

describe("isValidPosition", () => {
  it("accepts 1-3 and rejects others", () => {
    expect(isValidPosition(1)).toBe(true);
    expect(isValidPosition(3)).toBe(true);
    expect(isValidPosition(0)).toBe(false);
    expect(isValidPosition(4)).toBe(false);
  });
});

describe("itemId", () => {
  it("creates a stable synthetic id", () => {
    expect(itemId("2026-06-04", 2)).toBe("2026-06-04#2");
  });
});

describe("ruleOf3ItemStatus", () => {
  it("returns open for missing items", () => {
    expect(ruleOf3ItemStatus(null)).toBe("open");
  });

  it("prefers done over blocked", () => {
    expect(
      ruleOf3ItemStatus({
        id: "x",
        position: 1,
        title: "t",
        notes: "",
        completedAt: "2026-06-04T10:00:00.000Z",
        blockedReason: "still busy",
      }),
    ).toBe("done");
  });

  it("returns blocked when a reason is set and not completed", () => {
    expect(
      ruleOf3ItemStatus({
        id: "x",
        position: 1,
        title: "t",
        notes: "",
        completedAt: null,
        blockedReason: "ran out of time",
      }),
    ).toBe("blocked");
  });
});

describe("getDaySlots", () => {
  it("always returns three positioned slots", () => {
    const slots = getDaySlots(undefined);
    expect(slots).toHaveLength(3);
    expect(slots.map((s) => s.position)).toEqual([1, 2, 3]);
    expect(slots.every((s) => s.item === null)).toBe(true);
  });

  it("ignores blank-title items as empty slots", () => {
    const day = makeDay("2026-06-04", [
      {
        id: "2026-06-04#1",
        position: 1,
        title: "   ",
        notes: "",
        completedAt: null,
        blockedReason: "",
      },
    ]);
    expect(getDaySlots(day)[0].item).toBeNull();
  });
});

describe("dayProgress", () => {
  it("counts planned, done and blocked", () => {
    const day = makeDay("2026-06-04", [
      {
        id: "2026-06-04#1",
        position: 1,
        title: "Ship refactor",
        notes: "",
        completedAt: "2026-06-04T10:00:00.000Z",
        blockedReason: "",
      },
      {
        id: "2026-06-04#2",
        position: 2,
        title: "Review SDK job",
        notes: "",
        completedAt: null,
        blockedReason: "blocked on review",
      },
    ]);
    expect(dayProgress(day)).toEqual({ planned: 2, done: 1, blocked: 1 });
  });
});

describe("historyDays", () => {
  it("returns only past days with planned items, newest first", () => {
    const days: RuleOf3Day[] = [
      makeDay("2026-06-04", []),
      makeDay("2026-06-03", [
        {
          id: "2026-06-03#1",
          position: 1,
          title: "Older win",
          notes: "",
          completedAt: null,
          blockedReason: "",
        },
      ]),
      makeDay("2026-06-01", [
        {
          id: "2026-06-01#1",
          position: 1,
          title: "Oldest win",
          notes: "",
          completedAt: null,
          blockedReason: "",
        },
      ]),
      makeDay("2026-06-02", []),
    ];
    const result = historyDays(days, "2026-06-04");
    expect(result.map((d) => d.planDate)).toEqual(["2026-06-03", "2026-06-01"]);
  });
});

describe("upsertItem", () => {
  it("creates a new day when none exists", () => {
    const next = upsertItem([], "2026-06-04", 1, { title: "New win" });
    expect(next).toHaveLength(1);
    expect(next[0].items[0]).toMatchObject({
      position: 1,
      title: "New win",
      id: "2026-06-04#1",
    });
  });

  it("merges a patch onto an existing item without losing other fields", () => {
    const start = upsertItem([], "2026-06-04", 1, { title: "Win" });
    const next = upsertItem(start, "2026-06-04", 1, {
      completedAt: "2026-06-04T12:00:00.000Z",
    });
    expect(next[0].items[0]).toMatchObject({
      title: "Win",
      completedAt: "2026-06-04T12:00:00.000Z",
    });
  });

  it("keeps items ordered by position", () => {
    let days = upsertItem([], "2026-06-04", 3, { title: "Third" });
    days = upsertItem(days, "2026-06-04", 1, { title: "First" });
    days = upsertItem(days, "2026-06-04", 2, { title: "Second" });
    expect(days[0].items.map((i) => i.position)).toEqual([1, 2, 3]);
  });
});

describe("emptyDay", () => {
  it("creates an empty day keyed by planDate", () => {
    expect(emptyDay("2026-06-04")).toMatchObject({
      id: "2026-06-04",
      planDate: "2026-06-04",
      items: [],
    });
  });
});
