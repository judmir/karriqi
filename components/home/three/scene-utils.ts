import type { Room, WallSide } from "@/modules/home/apartment-model";
import type { FurnitureItem } from "@/types/home";

/** Scene units are meters (1 m = 100 cm from the geometry model). */
export const CM = 0.01;

export const WALL_HEIGHT_M = 2.7;
export const DOOR_HEIGHT_M = 2.05;
export const WINDOW_SILL_M = 0.9;
export const WINDOW_TOP_M = 2.1;

export type WallSegment = {
  /** Start/end along the wall (m, from the wall's start corner). */
  a: number;
  b: number;
  /** Vertical extent (m). */
  y0: number;
  y1: number;
};

export type WallOpeningVisual = {
  kind: "door" | "window";
  a: number;
  b: number;
  y0: number;
  y1: number;
};

/**
 * Split one wall into solid segments around its openings, plus the opening
 * visuals themselves. Doors keep a lintel above; windows keep sill + lintel.
 */
export function wallSegments(
  room: Room,
  wall: WallSide,
): { solids: WallSegment[]; openings: WallOpeningVisual[] } {
  const lengthM =
    wall === "north" || wall === "south" ? room.widthCm * CM : room.depthCm * CM;
  const H = WALL_HEIGHT_M;

  const walls = room.openings
    .filter((o) => o.wall === wall)
    .map((o) => ({
      ...o,
      aM: o.offsetCm * CM,
      bM: (o.offsetCm + o.widthCm) * CM,
    }))
    .sort((x, y) => x.aM - y.aM);

  const solids: WallSegment[] = [];
  const openings: WallOpeningVisual[] = [];
  let cursor = 0;

  for (const o of walls) {
    if (o.aM > cursor) {
      solids.push({ a: cursor, b: o.aM, y0: 0, y1: H });
    }
    if (o.kind === "door") {
      solids.push({ a: o.aM, b: o.bM, y0: DOOR_HEIGHT_M, y1: H });
      openings.push({ kind: "door", a: o.aM, b: o.bM, y0: 0, y1: DOOR_HEIGHT_M });
    } else {
      solids.push({ a: o.aM, b: o.bM, y0: 0, y1: WINDOW_SILL_M });
      solids.push({ a: o.aM, b: o.bM, y0: WINDOW_TOP_M, y1: H });
      openings.push({
        kind: "window",
        a: o.aM,
        b: o.bM,
        y0: WINDOW_SILL_M,
        y1: WINDOW_TOP_M,
      });
    }
    cursor = Math.max(cursor, o.bM);
  }
  if (cursor < lengthM) {
    solids.push({ a: cursor, b: lengthM, y0: 0, y1: H });
  }

  return { solids, openings };
}

/**
 * Placement of a wall plane segment in room-local 3D space (x right, y up,
 * z toward the viewer / room south). Walls face inward so backface culling
 * hides the walls nearest the camera (dollhouse effect).
 */
export function wallTransform(
  room: Room,
  wall: WallSide,
  seg: { a: number; b: number; y0: number; y1: number },
): {
  position: [number, number, number];
  rotationY: number;
  width: number;
  height: number;
} {
  const W = room.widthCm * CM;
  const D = room.depthCm * CM;
  const mid = (seg.a + seg.b) / 2;
  const y = (seg.y0 + seg.y1) / 2;
  const width = seg.b - seg.a;
  const height = seg.y1 - seg.y0;

  switch (wall) {
    case "north":
      return { position: [mid, y, 0], rotationY: 0, width, height };
    case "south":
      return { position: [mid, y, D], rotationY: Math.PI, width, height };
    case "west":
      return { position: [0, y, mid], rotationY: Math.PI / 2, width, height };
    case "east":
    default:
      return { position: [W, y, mid], rotationY: -Math.PI / 2, width, height };
  }
}

const HEIGHT_RULES: [RegExp, number][] = [
  [/wardrobe|closet|schrank|cabinet|bookcase|shelf|regal/i, 1.9],
  [/fridge|kühlschrank/i, 1.8],
  [/lamp|leuchte/i, 1.4],
  [/plant|pflanze/i, 1.1],
  [/counter|kitchen|küche|island/i, 0.92],
  [/chair|stuhl|armchair|sessel/i, 0.85],
  [/sofa|couch/i, 0.78],
  [/desk|table|tisch/i, 0.75],
  [/dresser|sideboard|kommode|tv/i, 0.6],
  [/bed|bett/i, 0.55],
  [/nightstand|nacht/i, 0.5],
  [/bench|bank|ottoman|pouf|hocker/i, 0.45],
  [/rug|teppich|mat\b/i, 0.03],
  [/toilet|wc/i, 0.45],
  [/bathtub|wanne|shower|dusche/i, 0.55],
];

/** Plausible visual height (m) for a furniture footprint. */
export function furnitureHeightM(item: FurnitureItem): number {
  const haystack = `${item.type} ${item.label}`;
  for (const [re, h] of HEIGHT_RULES) {
    if (re.test(haystack)) return h;
  }
  return 0.72;
}

const FURNITURE_COLORS = [
  "#b7a48b",
  "#8fa98f",
  "#a98f8f",
  "#8f9ba9",
  "#b0a1c4",
  "#c4b38a",
  "#9fb3a6",
  "#c2a68e",
];

/** Stable soft color per furniture type. */
export function furnitureColor(item: FurnitureItem, index: number): string {
  let hash = 0;
  for (const ch of item.type) {
    hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  }
  return FURNITURE_COLORS[Math.abs(hash + index) % FURNITURE_COLORS.length];
}

/** Axis-aligned footprint (m) accounting for 90°/270° rotation. */
export function furnitureFootprintM(item: FurnitureItem): {
  x: number;
  z: number;
  w: number;
  d: number;
} {
  const rotated = item.rotationDeg === 90 || item.rotationDeg === 270;
  const w = (rotated ? item.depthCm : item.widthCm) * CM;
  const d = (rotated ? item.widthCm : item.depthCm) * CM;
  return { x: item.xCm * CM, z: item.yCm * CM, w, d };
}
