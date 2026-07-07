import { describe, expect, it } from "vitest";

import {
  WE28_FLOORPLAN_ROOMS,
  polygonAreaM2,
} from "@/lib/apartment/we28-floorplan-geometry";

describe("we28-floorplan-geometry", () => {
  it("room polygons match PDF Flächenübersicht areas within tolerance", () => {
    const expected: Record<string, number> = {
      "zimmer-1": 20.9,
      flur: 11.3,
      "zimmer-2": 20.2,
      kueche: 8.8,
      bad: 5.9,
      "zimmer-3": 11.9,
      balkon: 6.0,
    };

    for (const room of WE28_FLOORPLAN_ROOMS) {
      const computed = polygonAreaM2(room.polygon);
      const target = expected[room.id];
      expect(target, room.id).toBeDefined();
      expect(computed).toBeCloseTo(target!, 0);
    }
  });

  it("lists all seven rooms from the area table", () => {
    expect(WE28_FLOORPLAN_ROOMS).toHaveLength(7);
    expect(WE28_FLOORPLAN_ROOMS.map((room) => room.code).sort()).toEqual([
      "001",
      "002",
      "003",
      "004",
      "005",
      "006",
      "007",
    ]);
  });
});
