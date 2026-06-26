import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import { ingestPulseItems } from "@/lib/repositories/ingest/pulse-items";
import type { Database } from "@/types/database";

const userId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

function createAdminMock(options: {
  existingByDedupe?: string | null;
  existingById?: string | null;
}) {
  const updates: unknown[] = [];
  const inserts: unknown[] = [];

  const from = vi.fn((table: string) => {
    expect(table).toBe("pulse_items");

    return {
      select: vi.fn(() => ({
        eq: vi.fn((_col: string, value: string) => ({
          eq: vi.fn((_col2: string, dedupeValue: string) => ({
            maybeSingle: vi.fn(async () => ({
              data:
                _col2 === "dedupe_key" && options.existingByDedupe
                  ? { id: options.existingByDedupe }
                  : null,
              error: null,
            })),
          })),
          maybeSingle: vi.fn(async () => ({
            data:
              _col === "id" && options.existingById
                ? { id: options.existingById }
                : null,
            error: null,
          })),
        })),
      })),
      update: vi.fn((patch: unknown) => {
        updates.push(patch);
        return {
          eq: vi.fn(() => ({
            eq: vi.fn(async () => ({ error: null })),
          })),
        };
      }),
      insert: vi.fn((row: unknown) => {
        inserts.push(row);
        return Promise.resolve({ error: null });
      }),
    };
  });

  return {
    admin: { from } as unknown as SupabaseClient<Database>,
    updates,
    inserts,
  };
}

describe("ingestPulseItems", () => {
  it("updates an existing row matched by dedupeKey", async () => {
    const { admin, updates, inserts } = createAdminMock({
      existingByDedupe: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    });

    const results = await ingestPulseItems(admin, {
      userId,
      items: [
        {
          title: "Updated title",
          summary: "Updated summary",
          category: "berlin_life",
          impact: "medium",
          urgency: "watch",
          dedupeKey: "same-key",
        },
      ],
    });

    expect(results).toEqual([
      { id: "cccccccc-cccc-cccc-cccc-cccccccccccc", action: "updated" },
    ]);
    expect(updates).toHaveLength(1);
    expect(inserts).toHaveLength(0);
  });

  it("creates a new row when dedupeKey is unseen", async () => {
    const { admin, updates, inserts } = createAdminMock({});

    const results = await ingestPulseItems(admin, {
      userId,
      items: [
        {
          title: "New item",
          summary: "Summary",
          category: "berlin_life",
          impact: "low",
          urgency: "watch",
          dedupeKey: "fresh-key",
        },
      ],
    });

    expect(results[0]?.action).toBe("created");
    expect(inserts).toHaveLength(1);
    expect(updates).toHaveLength(0);
  });
});
