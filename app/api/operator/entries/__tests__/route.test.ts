import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

import type { OperatorEntryIngestBody } from "@/modules/operator/operator-entry-ingest-schema";

import { upsertOperatorEntry } from "@/lib/repositories/operator-entries";
import { buildWeekendPlannerIngest } from "@/test/fixtures/weekend-planner-ingest";
import { buildApartmentFindingIngest } from "@/test/fixtures/apartment-finding-ingest";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({})),
}));

vi.mock("@/lib/repositories/operator-entries", () => ({
  upsertOperatorEntry: vi.fn(),
}));

import { POST } from "../route";

function authHeader(token = "test-token") {
  return { Authorization: `Bearer ${token}` };
}

describe("POST /api/operator/entries", () => {
  beforeEach(() => {
    vi.stubEnv("OPERATOR_INGEST_TOKEN", "test-token");
    vi.mocked(upsertOperatorEntry).mockResolvedValue({
      id: "11111111-1111-1111-1111-111111111111",
      updatedAt: "2026-05-02T18:30:00.000Z",
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("returns 501 when OPERATOR_INGEST_TOKEN is not configured", async () => {
    vi.stubEnv("OPERATOR_INGEST_TOKEN", " ");
    const res = await POST(
      new Request("http://karriqi.test/api/operator/entries", {
        method: "POST",
        headers: authHeader(),
        body: "{}",
      }),
    );
    expect(res.status).toBe(501);
  });

  it("returns 401 for missing or incorrect bearer token", async () => {
    const reqNoHeader = await POST(
      new Request("http://karriqi.test/api/operator/entries", {
        method: "POST",
        headers: {},
        body: "{}",
      }),
    );
    expect(reqNoHeader.status).toBe(401);

    const reqBad = await POST(
      new Request("http://karriqi.test/api/operator/entries", {
        method: "POST",
        headers: authHeader("wrong"),
        body: "{}",
      }),
    );
    expect(reqBad.status).toBe(401);
  });

  it("returns 400 for malformed JSON body", async () => {
    const res = await POST(
      new Request("http://karriqi.test/api/operator/entries", {
        method: "POST",
        headers: { ...authHeader(), "content-type": "application/json" },
        body: "not-json",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid ingest shape", async () => {
    const res = await POST(
      new Request("http://karriqi.test/api/operator/entries", {
        method: "POST",
        headers: { ...authHeader(), "content-type": "application/json" },
        body: JSON.stringify({
          kind: "weekend_planner",
          userId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("accepts valid weekend ingest and calls upsert", async () => {
    const body = buildWeekendPlannerIngest();
    const res = await POST(
      new Request("http://karriqi.test/api/operator/entries", {
        method: "POST",
        headers: { ...authHeader(), "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      status: "upserted",
      id: "11111111-1111-1111-1111-111111111111",
    });
    expect(upsertOperatorEntry).toHaveBeenCalledTimes(1);
    const firstArg = vi.mocked(upsertOperatorEntry).mock.calls[0]![1] as OperatorEntryIngestBody;
    expect(firstArg.dedupeKey).toBe(body.dedupeKey);
  });

  it("upserts dedupe keys without branching to duplicate inserts (delegates to repo)", async () => {
    const body = buildWeekendPlannerIngest();
    const hdrs = {
      Authorization: authHeader().Authorization ?? "",
      "content-type": "application/json",
    };

    await POST(
      new Request("http://karriqi.test/api/operator/entries", {
        method: "POST",
        headers: hdrs,
        body: JSON.stringify(body),
      }),
    );

    await POST(
      new Request("http://karriqi.test/api/operator/entries", {
        method: "POST",
        headers: hdrs,
        body: JSON.stringify({ ...body, title: "Updated title copy" }),
      }),
    );

    expect(upsertOperatorEntry).toHaveBeenCalledTimes(2);

    expect(
      (vi.mocked(upsertOperatorEntry).mock.calls[0]![1] as OperatorEntryIngestBody).dedupeKey,
    ).toEqual(
      (vi.mocked(upsertOperatorEntry).mock.calls[1]![1] as OperatorEntryIngestBody).dedupeKey,
    );
  });

  it("accepts valid apartment finding ingest and calls upsert", async () => {
    const body = buildApartmentFindingIngest();
    const res = await POST(
      new Request("http://karriqi.test/api/operator/entries", {
        method: "POST",
        headers: { ...authHeader(), "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      status: "upserted",
      id: "11111111-1111-1111-1111-111111111111",
    });
    expect(upsertOperatorEntry).toHaveBeenCalledTimes(1);
    const firstArg = vi.mocked(upsertOperatorEntry).mock.calls[0]![1] as OperatorEntryIngestBody;
    expect(firstArg.kind).toBe("apartment_finding");
    expect(firstArg.dedupeKey).toBe(body.dedupeKey);
  });
});
