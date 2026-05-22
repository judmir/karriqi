import { describe, expect, it } from "vitest";

import { calendarEventsIngestSchema } from "@/modules/ingest/schemas/calendar-events";
import { kanbanIngestSchema } from "@/modules/ingest/schemas/kanban";
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
});
