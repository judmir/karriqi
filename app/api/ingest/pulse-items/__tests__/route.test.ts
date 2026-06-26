import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ingestPulseItems } from "@/lib/repositories/ingest/pulse-items";

import { POST } from "../route";

vi.mock("@/lib/repositories/ingest/pulse-items", () => ({
  ingestPulseItems: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({})),
}));

describe("POST /api/ingest/pulse-items", () => {
  beforeEach(() => {
    vi.stubEnv("INGEST_TOKEN", "test-ingest-token");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("returns 401 without Bearer token", async () => {
    const res = await POST(
      new Request("http://karriqi.test/api/ingest/pulse-items", {
        method: "POST",
        body: "{}",
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid body", async () => {
    const res = await POST(
      new Request("http://karriqi.test/api/ingest/pulse-items", {
        method: "POST",
        headers: { authorization: "Bearer test-ingest-token" },
        body: JSON.stringify({ userId: "not-a-uuid", items: [] }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("accepts valid ingest and returns results", async () => {
    vi.mocked(ingestPulseItems).mockResolvedValue([
      { id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", action: "created" },
    ]);

    const res = await POST(
      new Request("http://karriqi.test/api/ingest/pulse-items", {
        method: "POST",
        headers: {
          authorization: "Bearer test-ingest-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          userId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          items: [
            {
              title: "Rent cap update",
              summary: "New guidance for Berlin Mietspiegel references.",
              category: "berlin_life",
              impact: "high",
              urgency: "this_month",
              dedupeKey: "berlin-rent-2026-06",
            },
          ],
        }),
      }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("ok");
    expect(json.results).toHaveLength(1);
    expect(ingestPulseItems).toHaveBeenCalledOnce();
  });
});
