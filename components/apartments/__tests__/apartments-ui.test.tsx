import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ApartmentDetailView } from "@/components/apartments/apartment-detail-view";
import { ApartmentsList } from "@/components/apartments/apartments-list";
import type { OperatorEntryRow } from "@/types/operator";

import { buildApartmentFindingIngest } from "@/test/fixtures/apartment-finding-ingest";

describe("ApartmentsList", () => {
  it("renders a New badge for unseen items", () => {
    const ingest = buildApartmentFindingIngest();
    const row: OperatorEntryRow = {
      id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      user_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      kind: "apartment_finding",
      title: ingest.title,
      summary: ingest.summary ?? null,
      dedupe_key: ingest.dedupeKey,
      starts_at: ingest.startsAt ?? null,
      ends_at: ingest.endsAt ?? null,
      payload: ingest.payload,
      source: "hermes",
      created_at: "2026-05-03T12:00:00Z",
      updated_at: "2026-05-03T12:00:00Z",
    };

    render(
      <ApartmentsList
        items={[
          {
            row,
            payload: ingest.payload,
            unseen: true,
          },
        ]}
      />,
    );

    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: new RegExp(ingest.title) })).toHaveAttribute(
      "href",
      "/apartments/cccccccc-cccc-cccc-cccc-cccccccccccc",
    );
  });
});

describe("ApartmentDetailView", () => {
  it("shows verdict, Hermes evaluation, and source link", () => {
    const ingest = buildApartmentFindingIngest();
    const row: OperatorEntryRow = {
      id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      user_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      kind: "apartment_finding",
      title: ingest.title,
      summary: ingest.summary ?? null,
      dedupe_key: ingest.dedupeKey,
      starts_at: ingest.startsAt ?? null,
      ends_at: ingest.endsAt ?? null,
      payload: ingest.payload,
      source: "hermes",
      created_at: "2026-05-03T12:00:00Z",
      updated_at: "2026-05-03T12:00:00Z",
    };

    render(<ApartmentDetailView row={row} payload={ingest.payload} />);

    expect(screen.getByRole("heading", { name: ingest.title })).toBeInTheDocument();
    expect(screen.getByText(ingest.payload.verdict)).toBeInTheDocument();
    expect(screen.getByText(/Elevator absent/i)).toBeInTheDocument();
    const source = screen.getByRole("link", { name: /View listing source/i });
    expect(source).toHaveAttribute("href", ingest.payload.sourceUrl);
  });
});
