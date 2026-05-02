import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import { fetchCurrentWeekendPlannerForUser } from "@/lib/repositories/operator-entries";
import type { OperatorEntryRow } from "@/types/operator";
import type { Database } from "@/types/database";

import { buildWeekendPlannerIngest } from "@/test/fixtures/weekend-planner-ingest";

function supabaseReturningRows(rows: OperatorEntryRow[] | null) {
  let eqCalls = 0;
  const chain = {
    eq: () => {
      eqCalls += 1;
      if (eqCalls >= 2) {
        return Promise.resolve({ data: rows, error: null });
      }
      return chain;
    },
  };

  const from = vi.fn(() => ({
    select: vi.fn(() => chain),
  }));

  return { from } as unknown as SupabaseClient<Database>;
}

describe("fetchCurrentWeekendPlannerForUser", () => {
  it("hydrates validated payload rows from the picker result", async () => {
    const ingest = buildWeekendPlannerIngest();
    const row: OperatorEntryRow = {
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      user_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      kind: "weekend_planner",
      title: ingest.title,
      summary: ingest.summary ?? null,
      dedupe_key: ingest.dedupeKey,
      starts_at: ingest.startsAt ?? null,
      ends_at: ingest.endsAt ?? null,
      payload: ingest.payload,
      source: "hermes",
      created_at: "2026-05-02T12:00:00Z",
      updated_at: "2026-05-02T12:00:00Z",
    };

    const client = supabaseReturningRows([row]);

    const result = await fetchCurrentWeekendPlannerForUser(
      client,
      row.user_id,
      new Date("2026-05-09T14:00:00Z"),
    );

    expect(result?.payload.items).toHaveLength(3);
    expect(result?.row.id).toBe(row.id);
  });

  it("returns null when stored payload no longer validates", async () => {
    const badRow: OperatorEntryRow = {
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      user_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      kind: "weekend_planner",
      title: "X",
      summary: null,
      dedupe_key: "k",
      starts_at: "2026-05-09T10:00:00Z",
      ends_at: "2026-05-09T23:00:00Z",
      payload: { items: [{}] },
      source: "hermes",
      created_at: "2026-05-02T12:00:00Z",
      updated_at: "2026-05-02T12:00:00Z",
    };

    const client = supabaseReturningRows([badRow]);

    await expect(
      fetchCurrentWeekendPlannerForUser(
        client,
        badRow.user_id,
        new Date("2026-05-09T14:00:00Z"),
      ),
    ).resolves.toBeNull();
  });
});
