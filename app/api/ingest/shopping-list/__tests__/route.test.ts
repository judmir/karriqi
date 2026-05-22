import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ingestShoppingList } from "@/lib/repositories/ingest/shopping-list";

import { POST } from "../route";

vi.mock("@/lib/repositories/ingest/shopping-list", () => ({
  ingestShoppingList: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({})),
}));

describe("POST /api/ingest/shopping-list", () => {
  beforeEach(() => {
    vi.stubEnv("INGEST_TOKEN", "test-ingest-token");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("returns 501 when INGEST_TOKEN is not configured", async () => {
    vi.stubEnv("INGEST_TOKEN", " ");
    const res = await POST(
      new Request("http://karriqi.test/api/ingest/shopping-list", {
        method: "POST",
        headers: { authorization: "Bearer test-ingest-token" },
        body: JSON.stringify({ userId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", items: [] }),
      }),
    );
    expect(res.status).toBe(501);
  });

  it("returns 401 without Bearer token", async () => {
    const res = await POST(
      new Request("http://karriqi.test/api/ingest/shopping-list", {
        method: "POST",
        body: "{}",
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid body", async () => {
    const res = await POST(
      new Request("http://karriqi.test/api/ingest/shopping-list", {
        method: "POST",
        headers: { authorization: "Bearer test-ingest-token" },
        body: JSON.stringify({ userId: "not-a-uuid", items: [] }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("accepts valid ingest and returns results", async () => {
    vi.mocked(ingestShoppingList).mockResolvedValue([
      { id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", action: "created" },
    ]);

    const res = await POST(
      new Request("http://karriqi.test/api/ingest/shopping-list", {
        method: "POST",
        headers: {
          authorization: "Bearer test-ingest-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          userId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          items: [{ name: "Milk" }],
        }),
      }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("ok");
    expect(json.results).toHaveLength(1);
    expect(ingestShoppingList).toHaveBeenCalledOnce();
  });
});
