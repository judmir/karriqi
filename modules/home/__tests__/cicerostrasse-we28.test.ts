import { describe, expect, it } from "vitest";

import {
  apartmentBounds,
  boundingBox,
  polygonAreaM2,
} from "@/modules/home/apartment-model";
import {
  CICEROSTRASSE_WE28,
  getRoom,
  roomIds,
} from "@/modules/home/cicerostrasse-we28";

describe("Cicerostrasse WE28 geometry", () => {
  it("has all seven rooms from the plan", () => {
    expect(roomIds().sort()).toEqual(
      [
        "bad",
        "balkon",
        "flur",
        "kueche",
        "zimmer-1",
        "zimmer-2",
        "zimmer-3",
      ].sort(),
    );
  });

  it("each room polygon area matches its official WoFlV area", () => {
    for (const room of CICEROSTRASSE_WE28.rooms) {
      const computed = polygonAreaM2(room.polygon);
      expect(
        Math.abs(computed - room.officialAreaM2),
        `${room.name} area ${computed.toFixed(3)} vs ${room.officialAreaM2}`,
      ).toBeLessThanOrEqual(0.05);
    }
  });

  it("polygon width/depth match the declared interior dimensions", () => {
    for (const room of CICEROSTRASSE_WE28.rooms) {
      const bounds = boundingBox(room.polygon);
      expect(bounds.width).toBe(room.widthCm);
      expect(bounds.height).toBe(room.depthCm);
    }
  });

  it("no two placed rooms overlap in the overview", () => {
    const placed = CICEROSTRASSE_WE28.rooms.map((room) => {
      const b = boundingBox(room.polygon);
      return {
        id: room.id,
        minX: room.origin.x + b.minX,
        minY: room.origin.y + b.minY,
        maxX: room.origin.x + b.maxX,
        maxY: room.origin.y + b.maxY,
      };
    });

    for (let i = 0; i < placed.length; i += 1) {
      for (let j = i + 1; j < placed.length; j += 1) {
        const a = placed[i];
        const b = placed[j];
        const overlaps =
          a.minX < b.maxX &&
          a.maxX > b.minX &&
          a.minY < b.maxY &&
          a.maxY > b.minY;
        expect(overlaps, `${a.id} overlaps ${b.id}`).toBe(false);
      }
    }
  });

  it("openings sit within their wall length", () => {
    for (const room of CICEROSTRASSE_WE28.rooms) {
      for (const opening of room.openings) {
        const wallLength =
          opening.wall === "north" || opening.wall === "south"
            ? room.widthCm
            : room.depthCm;
        expect(
          opening.offsetCm + opening.widthCm,
          `${room.name} ${opening.id} exceeds wall`,
        ).toBeLessThanOrEqual(wallLength);
      }
    }
  });

  it("summed room areas are close to the declared total", () => {
    const sum = CICEROSTRASSE_WE28.rooms
      .filter((room) => room.id !== "balkon")
      .reduce((acc, room) => acc + room.officialAreaM2, 0);
    // Balcony counts half toward living area; total on the plan is 82.0 m².
    expect(sum + CICEROSTRASSE_WE28.rooms.find((r) => r.id === "balkon")!.officialAreaM2 / 2).toBeCloseTo(
      82.0,
      0,
    );
  });

  it("getRoom resolves known ids and rejects unknown", () => {
    expect(getRoom("kueche")?.name).toBe("Küche");
    expect(getRoom("nope")).toBeUndefined();
  });

  it("apartment bounds are positive", () => {
    const bounds = apartmentBounds(CICEROSTRASSE_WE28);
    expect(bounds.width).toBeGreaterThan(0);
    expect(bounds.height).toBeGreaterThan(0);
  });
});
