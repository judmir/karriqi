import { describe, expect, it } from "vitest";

import { buildWeekendPlannerIngest } from "@/test/fixtures/weekend-planner-ingest";
import {
  weekendPlannerIngestSchema,
  weekendPlannerPayloadSchema,
} from "@/modules/operator/weekend-planner-schema";

describe("weekendPlannerIngestSchema", () => {
  it("accepts example Hermes-shaped JSON", () => {
    const body = buildWeekendPlannerIngest();
    const parsed = weekendPlannerIngestSchema.safeParse(body);
    expect(parsed.success).toBe(true);
  });

  it("rejects wrong kind", () => {
    const body = structuredClone(buildWeekendPlannerIngest()) as Record<string, unknown>;
    body.kind = "other_plan";
    const parsed = weekendPlannerIngestSchema.safeParse(body);
    expect(parsed.success).toBe(false);
  });

  it("rejects non-unique or non-sequential ranks", () => {
    const b = buildWeekendPlannerIngest();
    const bad = structuredClone(b);
    bad.payload.items[0].rank = 2;
    bad.payload.items[1].rank = 2;
    const parsed = weekendPlannerIngestSchema.safeParse(bad);
    expect(parsed.success).toBe(false);
  });

  it("allows 1 item with rank 1 only", () => {
    const b = buildWeekendPlannerIngest();
    b.payload.items = [structuredClone(b.payload.items[0]!)];
    b.payload.items[0].rank = 1;
    const parsed = weekendPlannerIngestSchema.safeParse(b);
    expect(parsed.success).toBe(true);
  });

  it("allows optional booking URLs", () => {
    const b = buildWeekendPlannerIngest();
    for (const item of b.payload.items) {
      item.bookingUrl = undefined;
    }
    const parsed = weekendPlannerPayloadSchema.safeParse(b.payload);
    expect(parsed.success).toBe(true);
  });
});
