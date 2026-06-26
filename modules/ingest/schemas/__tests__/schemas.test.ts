import { describe, expect, it } from "vitest";

import { calendarEventsIngestSchema } from "@/modules/ingest/schemas/calendar-events";
import { kanbanIngestSchema } from "@/modules/ingest/schemas/kanban";
import { pulseItemsIngestSchema } from "@/modules/ingest/schemas/pulse-items";
import { shoppingListIngestSchema } from "@/modules/ingest/schemas/shopping-list";

const userId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

describe("ingest schemas", () => {
  it("accepts minimal shopping list ingest", () => {
    const parsed = shoppingListIngestSchema.safeParse({
      userId,
      items: [{ name: "Bread" }],
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts minimal kanban ingest", () => {
    const parsed = kanbanIngestSchema.safeParse({
      userId,
      tasks: [{ title: "Review listings" }],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects calendar event when end is before start", () => {
    const parsed = calendarEventsIngestSchema.safeParse({
      userId,
      events: [
        {
          title: "Viewing",
          startAt: "2026-05-22T18:00:00+02:00",
          endAt: "2026-05-22T10:00:00+02:00",
        },
      ],
    });
    expect(parsed.success).toBe(false);
  });


  it("accepts minimal pulse items ingest", () => {
    const parsed = pulseItemsIngestSchema.safeParse({
      userId,
      items: [
        {
          title: "BVG line U5 weekend changes",
          summary: "Replacement buses on section Mitte–Hönow Sat–Sun.",
          category: "berlin_life",
          impact: "medium",
          urgency: "this_week",
          dedupeKey: "bvg-u5-2026-06-28",
        },
      ],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects pulse items with invalid category", () => {
    const parsed = pulseItemsIngestSchema.safeParse({
      userId,
      items: [
        {
          title: "Test",
          summary: "Test",
          category: "housing",
          impact: "low",
          urgency: "watch",
          dedupeKey: "x",
        },
      ],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects pulse items with invalid confidence", () => {
    const parsed = pulseItemsIngestSchema.safeParse({
      userId,
      items: [
        {
          title: "Test",
          summary: "Test",
          category: "berlin_life",
          impact: "low",
          urgency: "watch",
          dedupeKey: "x",
          confidence: 1.5,
        },
      ],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects pulse items with unknown fields", () => {
    const parsed = pulseItemsIngestSchema.safeParse({
      userId,
      items: [
        {
          title: "Test",
          summary: "Test",
          category: "berlin_life",
          impact: "low",
          urgency: "watch",
          dedupeKey: "x",
          extra: true,
        },
      ],
    });
    expect(parsed.success).toBe(false);
  });
});
