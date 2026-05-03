import { describe, expect, it } from "vitest";

import {
  apartmentFindingIngestSchema,
  apartmentFindingPayloadSchema,
} from "@/modules/operator/apartment-finding-schema";
import { operatorEntryIngestSchema } from "@/modules/operator/operator-entry-ingest-schema";

describe("apartmentFindingPayloadSchema", () => {
  it("accepts a complete normalized payload", () => {
    const parsed = apartmentFindingPayloadSchema.safeParse({
      location: "Mitte",
      priceText: "€2,100",
      sqm: 65,
      rooms: 2.5,
      verdict: "Skip",
      hermesEvaluation: "Noisy street and high service charge.",
      sourceUrl: "https://example.com/a",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects a payload missing required evaluation fields", () => {
    const parsed = apartmentFindingPayloadSchema.safeParse({
      location: "Mitte",
      priceText: "€2,100",
      verdict: "Skip",
      sourceUrl: "not-a-url",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("apartmentFindingIngestSchema", () => {
  it("requires kind apartment_finding and nested payload", () => {
    const parsed = apartmentFindingIngestSchema.safeParse({
      userId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      kind: "apartment_finding",
      title: "Test",
      dedupeKey: "k1",
      payload: {
        location: "X",
        priceText: "€1",
        verdict: "Y",
        hermesEvaluation: "Z",
        sourceUrl: "https://example.com/",
      },
    });
    expect(parsed.success).toBe(true);
  });
});

describe("operatorEntryIngestSchema", () => {
  it("Still accepts weekend_planner branch", () => {
    const parsed = operatorEntryIngestSchema.safeParse({
      userId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      kind: "weekend_planner",
      title: "Weekend options",
      dedupeKey: "w1",
      startsAt: "2026-05-09T00:00:00+02:00",
      endsAt: "2026-05-10T23:59:59+02:00",
      payload: {
        locationLabel: "Berlin",
        audience: "family",
        items: [
          {
            rank: 1,
            title: "Museum",
            startsAt: "2026-05-09T11:00:00+02:00",
            category: "museum",
            costText: "€10",
            travelTimeText: "20 min",
            isIndoor: true,
            isRainFallback: false,
          },
        ],
      },
    });
    expect(parsed.success).toBe(true);
  });
});
