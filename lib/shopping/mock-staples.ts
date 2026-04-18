import type { StapleItem } from "@/types/shopping";

export const mockStaples: StapleItem[] = [
  {
    id: "staple-milk",
    name: "Milk",
    category: "Dairy",
    unit: "1 L",
    typicalIntervalDays: 5,
    lastPurchasedAt: new Date(
      Date.now() - 4 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    createdAt: "2026-01-01T12:00:00.000Z",
  },
  {
    id: "staple-eggs",
    name: "Eggs",
    category: "Dairy",
    unit: "12 pack",
    typicalIntervalDays: 7,
    lastPurchasedAt: new Date(
      Date.now() - 10 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    createdAt: "2026-01-02T12:00:00.000Z",
  },
  {
    id: "staple-bread",
    name: "Bread",
    category: "Bakery",
    unit: "loaf",
    typicalIntervalDays: 4,
    createdAt: "2026-01-03T12:00:00.000Z",
  },
  {
    id: "staple-bananas",
    name: "Bananas",
    category: "Produce",
    unit: "bunch",
    typicalIntervalDays: 5,
    lastPurchasedAt: new Date(
      Date.now() - 2 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    createdAt: "2026-01-04T12:00:00.000Z",
  },
];
