import { describe, expect, it } from "vitest";

import {
  DOOR_CLEARANCE_CM,
  furnitureFootprint,
  validateLayout,
} from "@/lib/home/layout-validation";
import { getRoom } from "@/modules/home/cicerostrasse-we28";
import type { FurnitureItem, RoomLayout } from "@/types/home";

const kueche = getRoom("kueche")!; // 217 x 406, door north wall offset 60 w85

function item(overrides: Partial<FurnitureItem>): FurnitureItem {
  return {
    type: "generic",
    label: "Item",
    widthCm: 100,
    depthCm: 60,
    xCm: 20,
    yCm: 20,
    rotationDeg: 0,
    material: null,
    color: null,
    ...overrides,
  };
}

function layout(furniture: FurnitureItem[]): RoomLayout {
  return { styleSummary: "test", furniture };
}

describe("furnitureFootprint", () => {
  it("swaps width/depth for 90° rotation", () => {
    const rect = furnitureFootprint(
      item({ widthCm: 100, depthCm: 40, xCm: 0, yCm: 0, rotationDeg: 90 }),
    );
    expect(rect.maxX).toBe(40);
    expect(rect.maxY).toBe(100);
  });
});

describe("validateLayout", () => {
  it("accepts furniture fully inside and clear of the door", () => {
    const result = validateLayout(
      kueche,
      layout([item({ widthCm: 100, depthCm: 60, xCm: 10, yCm: 200 })]),
    );
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("flags furniture that extends outside the room", () => {
    const result = validateLayout(
      kueche,
      layout([item({ widthCm: 100, depthCm: 60, xCm: 180, yCm: 200 })]),
    );
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes("outside"))).toBe(true);
  });

  it("flags overlapping furniture", () => {
    const result = validateLayout(
      kueche,
      layout([
        item({ label: "A", xCm: 10, yCm: 200 }),
        item({ label: "B", xCm: 40, yCm: 220 }),
      ]),
    );
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes("overlaps"))).toBe(true);
  });

  it("flags furniture blocking the door clearance", () => {
    // Door on north wall, offset 60..145 in x. Clearance zone y 0..75.
    const result = validateLayout(
      kueche,
      layout([
        item({
          label: "Fridge",
          widthCm: 60,
          depthCm: 60,
          xCm: 70,
          yCm: 10,
        }),
      ]),
    );
    expect(result.valid).toBe(false);
    expect(
      result.issues.some((i) => i.includes("doorway clearance")),
    ).toBe(true);
  });

  it("exposes the clearance constant", () => {
    expect(DOOR_CLEARANCE_CM).toBeGreaterThanOrEqual(60);
  });
});
