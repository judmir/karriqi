import { describe, expect, it } from "vitest";

import { pickCurrentWeekendPlannerEntry } from "@/modules/operator/weekend-planner";
import type { OperatorEntryRow } from "@/types/operator";

function row(
  overrides: Partial<OperatorEntryRow> & Pick<OperatorEntryRow, "id">,
): OperatorEntryRow {
  return {
    user_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    kind: "weekend_planner",
    title: "Weekend",
    summary: null,
    dedupe_key: overrides.dedupe_key ?? "wk-1",
    starts_at: null,
    ends_at: null,
    payload: { locationLabel: "X", audience: "family", items: [] },
    source: "hermes",
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("pickCurrentWeekendPlannerEntry", () => {
  it("prefers an active relevance window containing now", () => {
    const now = new Date("2026-05-09T14:00:00Z");
    const stale = row({
      id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      dedupe_key: "past",
      starts_at: "2026-05-02T10:00:00Z",
      ends_at: "2026-05-03T20:00:00Z",
      updated_at: "2026-05-04T08:00:00Z",
    });
    const current = row({
      id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      dedupe_key: "current",
      starts_at: "2026-05-09T06:00:00Z",
      ends_at: "2026-05-09T23:59:59Z",
      updated_at: "2026-05-04T07:00:00Z",
    });
    const future = row({
      id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
      dedupe_key: "future-start",
      starts_at: "2026-05-09T23:58:59Z",
      ends_at: "2026-05-09T23:59:58Z",
    });

    const picked = pickCurrentWeekendPlannerEntry([stale, future, current], now);
    expect(picked?.dedupe_key).toBe("current");
  });

  it("otherwise picks nearest upcoming starts_at", () => {
    const now = new Date("2026-05-06T14:00:00Z");
    const a = row({
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      dedupe_key: "later",
      starts_at: "2026-05-10T00:00:00Z",
      ends_at: null,
    });
    const b = row({
      id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      dedupe_key: "sooner",
      starts_at: "2026-05-07T06:00:00Z",
      ends_at: null,
    });

    const picked = pickCurrentWeekendPlannerEntry([a, b], now);
    expect(picked?.dedupe_key).toBe("sooner");
  });

  it("fallback: newest starts_at among past windows when nothing else fits", () => {
    const now = new Date("2026-05-06T14:00:00Z");
    const older = row({
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      dedupe_key: "older-weekend",
      starts_at: "2026-05-03T06:00:00Z",
      ends_at: "2026-05-04T20:00:00Z",
      updated_at: "2026-05-03T06:00:00Z",
    });
    const newer = row({
      id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      dedupe_key: "newer-weekend",
      starts_at: "2026-05-04T06:00:00Z",
      ends_at: "2026-05-05T18:00:00Z",
      updated_at: "2026-05-05T06:00:00Z",
    });

    const picked = pickCurrentWeekendPlannerEntry([older, newer], now);
    expect(picked?.dedupe_key).toBe("newer-weekend");
  });
});
