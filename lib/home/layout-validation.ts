import type { Room, RoomOpening } from "@/modules/home/apartment-model";
import type { FurnitureItem, RoomLayout } from "@/types/home";

/** Minimum clear depth (cm) to keep in front of a door. */
export const DOOR_CLEARANCE_CM = 75;
/** Tolerance (cm) for rounding when checking bounds/overlaps. */
const TOLERANCE_CM = 2;

export type Rect = { minX: number; minY: number; maxX: number; maxY: number };

export type ValidationResult = {
  valid: boolean;
  issues: string[];
};

/** Axis-aligned footprint of a furniture item, accounting for 90°/270° rotation. */
export function furnitureFootprint(item: FurnitureItem): Rect {
  const rotated = item.rotationDeg === 90 || item.rotationDeg === 270;
  const w = rotated ? item.depthCm : item.widthCm;
  const h = rotated ? item.widthCm : item.depthCm;
  return {
    minX: item.xCm,
    minY: item.yCm,
    maxX: item.xCm + w,
    maxY: item.yCm + h,
  };
}

function rectsOverlap(a: Rect, b: Rect, tol: number): boolean {
  return (
    a.minX < b.maxX - tol &&
    a.maxX > b.minX + tol &&
    a.minY < b.maxY - tol &&
    a.maxY > b.minY + tol
  );
}

/** Clearance zone rectangle in front of a door, in room-local coordinates. */
export function doorClearanceZone(room: Room, opening: RoomOpening): Rect {
  const start = opening.offsetCm;
  const end = opening.offsetCm + opening.widthCm;
  switch (opening.wall) {
    case "north":
      return { minX: start, maxX: end, minY: 0, maxY: DOOR_CLEARANCE_CM };
    case "south":
      return {
        minX: start,
        maxX: end,
        minY: room.depthCm - DOOR_CLEARANCE_CM,
        maxY: room.depthCm,
      };
    case "west":
      return { minX: 0, maxX: DOOR_CLEARANCE_CM, minY: start, maxY: end };
    case "east":
    default:
      return {
        minX: room.widthCm - DOOR_CLEARANCE_CM,
        maxX: room.widthCm,
        minY: start,
        maxY: end,
      };
  }
}

/**
 * Validate a furnishing layout against fixed room geometry. Never mutates the
 * room. Returns a list of human-readable issues; `valid` is true when empty.
 */
export function validateLayout(room: Room, layout: RoomLayout): ValidationResult {
  const issues: string[] = [];
  const footprints = layout.furniture.map((item) => ({
    item,
    rect: furnitureFootprint(item),
  }));

  // 1. Inside the room boundary.
  for (const { item, rect } of footprints) {
    if (
      rect.minX < -TOLERANCE_CM ||
      rect.minY < -TOLERANCE_CM ||
      rect.maxX > room.widthCm + TOLERANCE_CM ||
      rect.maxY > room.depthCm + TOLERANCE_CM
    ) {
      issues.push(
        `"${item.label}" extends outside the ${room.name} boundary (room is ${room.widthCm}×${room.depthCm} cm).`,
      );
    }
  }

  // 2. No furniture-on-furniture overlaps.
  for (let i = 0; i < footprints.length; i += 1) {
    for (let j = i + 1; j < footprints.length; j += 1) {
      if (rectsOverlap(footprints[i].rect, footprints[j].rect, TOLERANCE_CM)) {
        issues.push(
          `"${footprints[i].item.label}" overlaps "${footprints[j].item.label}".`,
        );
      }
    }
  }

  // 3. Keep door clearance zones free.
  for (const opening of room.openings) {
    if (opening.kind !== "door") continue;
    const zone = doorClearanceZone(room, opening);
    for (const { item, rect } of footprints) {
      if (rectsOverlap(rect, zone, TOLERANCE_CM)) {
        issues.push(
          `"${item.label}" blocks the doorway clearance (keep ${DOOR_CLEARANCE_CM} cm clear).`,
        );
      }
    }
  }

  return { valid: issues.length === 0, issues };
}
