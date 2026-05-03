import type { ApartmentFindingIngestBody } from "@/modules/operator/apartment-finding-schema";

export function buildApartmentFindingIngest(
  overrides: Partial<ApartmentFindingIngestBody> = {},
): ApartmentFindingIngestBody {
  const base: ApartmentFindingIngestBody = {
    userId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    kind: "apartment_finding",
    title: "Bright 3-room Kreuzberg Altbau",
    summary: "Quiet side street near Görlitzer Park.",
    dedupeKey: "apartment-find-2026-05-03-listing-42",
    startsAt: null,
    endsAt: null,
    payload: {
      location: "Kreuzberg, Berlin",
      priceText: "€1,980 / month cold",
      sqm: 78,
      rooms: 3,
      verdict: "Worth viewing — daylight and layout suit a small family.",
      hermesEvaluation:
        "Elevator absent but apartment is fourth floor.\nFlooring is laminate in living areas.",
      sourceUrl: "https://example.com/listings/42",
    },
  };

  return { ...base, ...overrides };
}
