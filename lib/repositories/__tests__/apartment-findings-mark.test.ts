import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import { markOperatorEntryViewed } from "@/lib/repositories/apartment-findings";
import type { Database } from "@/types/database";

describe("markOperatorEntryViewed", () => {
  it("treats duplicate inserts as idempotent (23505)", async () => {
    const chainResult = vi
      .fn()
      .mockResolvedValueOnce({ error: { code: "23505", message: "duplicate" } })
      .mockResolvedValueOnce({ error: null });

    const insert = vi.fn(() => chainResult());
    const client = {
      from: vi.fn(() => ({ insert })),
    } as unknown as SupabaseClient<Database>;

    await markOperatorEntryViewed(client, "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    await markOperatorEntryViewed(client, "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    expect(insert).toHaveBeenCalledTimes(2);
    expect(chainResult).toHaveBeenCalledTimes(2);
  });

  it("surfaces non-duplicate errors", async () => {
    const client = {
      from: vi.fn(() => ({
        insert: vi.fn(() =>
          Promise.resolve({
            error: { code: "42501", message: "permission denied" },
          }),
        ),
      })),
    } as unknown as SupabaseClient<Database>;

    await expect(
      markOperatorEntryViewed(
        client,
        "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      ),
    ).rejects.toEqual(expect.objectContaining({ code: "42501" }));
  });
});
