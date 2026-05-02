import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WeekendOptionsCard } from "@/components/operator/weekend-options-card";
import type { OperatorEntryRow } from "@/types/operator";

import { buildWeekendPlannerIngest } from "@/test/fixtures/weekend-planner-ingest";

describe("WeekendOptionsCard", () => {
  it('shows the empty-state message when Hermes has not posted yet', () => {
    render(<WeekendOptionsCard status="empty" />);

    expect(
      screen.getByText(/No weekend plan yet/i),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Weekend options/i),
    ).toBeInTheDocument();
  });

  it("shows one item when ingest included a single tier", () => {
    const ingest = buildWeekendPlannerIngest();
    ingest.payload.items = [structuredClone(ingest.payload.items[0]!)];
    ingest.payload.items[0]!.rank = 1;

    const row = {
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      user_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      kind: "weekend_planner" as const,
      title: ingest.title,
      summary: ingest.summary ?? null,
      dedupe_key: ingest.dedupeKey,
      starts_at: ingest.startsAt ?? null,
      ends_at: ingest.endsAt ?? null,
      payload: ingest.payload,
      source: "hermes",
      created_at: "2026-05-02T12:00:00Z",
      updated_at: "2026-05-02T12:00:00Z",
    } satisfies OperatorEntryRow;

    render(
      <WeekendOptionsCard
        status="ready"
        row={row}
        payload={ingest.payload}
      />,
    );

    const list = screen.getByRole("list");
    expect(within(list).getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByText(/Naturkundemuseum/)).toBeInTheDocument();
  });

  it("lists three curated ideas with outdoor + rain fallback chips visible", () => {
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

    render(
      <WeekendOptionsCard status="ready" row={row} payload={ingest.payload} />,
    );

    const list = screen.getByRole("list");
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);

    expect(screen.getByText("Outdoors")).toBeInTheDocument();
    expect(screen.getByText("Rain fallback")).toBeInTheDocument();
    expect(screen.getByText(/^Weather:/i)).toBeInTheDocument();
  });
});
