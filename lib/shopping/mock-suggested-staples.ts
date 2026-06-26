import type { StapleItem } from "@/types/shopping";

const base = new Date("2026-01-15T12:00:00.000Z").getTime();

/** Extra staples for local dev — merged into Suggested to test collapse/expand. */
export const MOCK_SUGGESTED_STAPLES: StapleItem[] = [
  {
    id: "mock-suggested-domate",
    name: "Domate",
    typicalIntervalDays: 5,
    lastPurchasedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(base).toISOString(),
  },
  {
    id: "mock-suggested-speca",
    name: "Speca",
    typicalIntervalDays: 6,
    lastPurchasedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(base + 3600000).toISOString(),
  },
  {
    id: "mock-suggested-qepa",
    name: "Qepë",
    typicalIntervalDays: 10,
    lastPurchasedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(base + 7200000).toISOString(),
  },
  {
    id: "mock-suggested-patate",
    name: "Patate",
    typicalIntervalDays: 7,
    lastPurchasedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(base + 10800000).toISOString(),
  },
  {
    id: "mock-suggested-oriz",
    name: "Oriz",
    typicalIntervalDays: 14,
    lastPurchasedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(base + 14400000).toISOString(),
  },
  {
    id: "mock-suggested-makarona",
    name: "Makarona",
    typicalIntervalDays: 14,
    lastPurchasedAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(base + 18000000).toISOString(),
  },
  {
    id: "mock-suggested-vaj",
    name: "Vaj ulliri",
    typicalIntervalDays: 21,
    lastPurchasedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(base + 21600000).toISOString(),
  },
  {
    id: "mock-suggested-krip",
    name: "Kripë",
    typicalIntervalDays: 30,
    lastPurchasedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(base + 25200000).toISOString(),
  },
];

export function mergeDevSuggestedStaples(
  staples: StapleItem[],
  options?: { includeMockSuggested?: boolean },
): StapleItem[] {
  const includeMockSuggested =
    options?.includeMockSuggested ??
    process.env.NEXT_PUBLIC_SHOPPING_MOCK_SUGGESTIONS === "1";
  if (!includeMockSuggested) {
    return staples;
  }

  const existingIds = new Set(staples.map((staple) => staple.id));
  const extras = MOCK_SUGGESTED_STAPLES.filter(
    (staple) => !existingIds.has(staple.id),
  );

  return extras.length > 0 ? [...staples, ...extras] : staples;
}
