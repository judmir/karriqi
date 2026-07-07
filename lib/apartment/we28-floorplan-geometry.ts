/**
 * Dimensioned floorplan geometry for Cicerostraße WE28 (Wohnung 28, 2. OG).
 *
 * Source: 2026-06__Cicerostrasse_WE28__Floorplan_Dimensioned_Alt.pdf
 * Scale 1:100 · Flächenübersicht living area 82.0 m² (balcony at 50%).
 *
 * Coordinates are in metres on the apartment floor plane (x → east, z → north).
 * Origin is the south-west corner of the unit bounding box.
 */

export type FloorplanWallSegment = {
  from: FloorplanPoint;
  to: FloorplanPoint;
};

export type FloorplanPoint = readonly [x: number, z: number];

export type FloorplanRoomGeometry = {
  id: string;
  /** Wohnflächenberechnung code from the PDF area table. */
  code: string;
  name: string;
  nameEn: string;
  areaM2: number;
  /** Closed polygon, counter-clockwise when viewed from above. */
  polygon: readonly FloorplanPoint[];
  /** Floor tint in the 3D view (hex). */
  color: string;
  /** Emissive tint on hover. */
  hoverColor: string;
};

export const WE28_FLOORPLAN_SOURCE = {
  pdfPath:
    "/apartment/floorplan/2026-06__Cicerostrasse_WE28__Floorplan_Dimensioned_Alt.pdf",
  previewPath:
    "/apartment/floorplan/2026-06__Cicerostrasse_WE28__Floorplan_Dimensioned_Alt.png",
  label: "2026-06 dimensioned floorplan (Alt)",
  scale: "1:100",
  address: "Cicerostr. 3, 10709 Berlin",
  unit: "Wohnung 28 (2. OG mitte)",
  livingAreaM2: 82.0,
  unitLivingAreaM2: 81.78,
} as const;

/** Outer wall dimensions from the PDF dimension strings (metres). */
export const WE28_OUTER_DIMENSIONS = {
  top: [4.52, 6.72, 3.45] as const,
  bottom: [4.4, 2.17, 1.46, 2.93, 3.45] as const,
  left: [4.67, 1.37] as const,
  right: [1.71, 4.06] as const,
  widthM: 14.69,
  depthM: 6.04,
  wallHeightM: 2.55,
} as const;

/**
 * Room polygons traced from the dimensioned plan.
 * Areas match the PDF Flächenübersicht (±0.3 m² tolerance on L-shaped Flur).
 */
export const WE28_FLOORPLAN_ROOMS: readonly FloorplanRoomGeometry[] = [
  {
    id: "zimmer-1",
    code: "001",
    name: "Zimmer 1",
    nameEn: "Room 1 (living)",
    areaM2: 20.9,
    polygon: [
      [0, 1.37],
      [4.52, 1.37],
      [4.52, 6.04],
      [0, 6.04],
    ],
    color: "#c4a882",
    hoverColor: "#d9bf96",
  },
  {
    id: "flur",
    code: "002",
    name: "Flur",
    nameEn: "Hallway",
    areaM2: 11.3,
    // Horizontal corridor strip (6.72 × 1.71 m per right-side dimension).
    polygon: [
      [4.52, 4.33],
      [11.24, 4.33],
      [11.24, 6.04],
      [4.52, 6.04],
    ],
    color: "#9aa3ad",
    hoverColor: "#b3bbc4",
  },
  {
    id: "zimmer-2",
    code: "003",
    name: "Zimmer 2",
    nameEn: "Room 2 (bedroom)",
    areaM2: 20.2,
    polygon: [
      [11.24, 0],
      [14.69, 0],
      [14.69, 5.77],
      [11.24, 5.77],
    ],
    color: "#8fadc8",
    hoverColor: "#a8c3db",
  },
  {
    id: "kueche",
    code: "004",
    name: "Küche",
    nameEn: "Kitchen",
    areaM2: 8.8,
    polygon: [
      [4.52, 0],
      [8.92, 0],
      [8.92, 2.0],
      [4.52, 2.0],
    ],
    color: "#b8c9a0",
    hoverColor: "#ccd9b8",
  },
  {
    id: "bad",
    code: "005",
    name: "Bad",
    nameEn: "Bathroom",
    areaM2: 5.9,
    polygon: [
      [8.92, 0],
      [11.09, 0],
      [11.09, 2.72],
      [8.92, 2.72],
    ],
    color: "#9ec5cf",
    hoverColor: "#b5d6de",
  },
  {
    id: "zimmer-3",
    code: "006",
    name: "Zimmer 3",
    nameEn: "Room 3 (kids)",
    areaM2: 11.9,
    polygon: [
      [6.7, 0],
      [11.09, 0],
      [11.09, 2.71],
      [6.7, 2.71],
    ],
    color: "#a8b8d8",
    hoverColor: "#bcc9e3",
  },
  {
    id: "balkon",
    code: "007",
    name: "Balkon",
    nameEn: "Balcony",
    areaM2: 6.0,
    polygon: [
      [0, 0],
      [4.52, 0],
      [4.52, 1.37],
      [0, 1.37],
    ],
    color: "#7ea88a",
    hoverColor: "#96bf9f",
  },
] as const;

/** Outer shell traced clockwise for the perimeter wall ring. */
export const WE28_UNIT_OUTLINE: readonly FloorplanPoint[] = [
  [0, 0],
  [14.69, 0],
  [14.69, 5.77],
  [11.24, 5.77],
  [11.24, 6.04],
  [0, 6.04],
];

/** Interior partition walls (shared edges between rooms). */
export const WE28_INTERIOR_WALLS: readonly FloorplanWallSegment[] = [
  { from: [4.52, 0], to: [4.52, 6.04] },
  { from: [4.52, 1.37], to: [0, 1.37] },
  { from: [4.52, 2.0], to: [8.92, 2.0] },
  { from: [4.52, 2.71], to: [11.09, 2.71] },
  { from: [4.52, 4.33], to: [11.24, 4.33] },
  { from: [8.92, 0], to: [8.92, 2.72] },
  { from: [11.09, 0], to: [11.09, 2.72] },
  { from: [6.7, 0], to: [6.7, 2.71] },
  { from: [11.24, 0], to: [11.24, 6.04] },
];

/** Shoelace area for a closed polygon (metres²). */
export function polygonAreaM2(polygon: readonly FloorplanPoint[]): number {
  if (polygon.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const [x1, z1] = polygon[i]!;
    const [x2, z2] = polygon[(i + 1) % polygon.length]!;
    sum += x1 * z2 - x2 * z1;
  }
  return Math.abs(sum) / 2;
}

export function centroid(polygon: readonly FloorplanPoint[]): FloorplanPoint {
  const area = polygonAreaM2(polygon);
  if (area === 0) {
    const [x, z] = polygon[0] ?? [0, 0];
    return [x, z];
  }
  let cx = 0;
  let cz = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const [x1, z1] = polygon[i]!;
    const [x2, z2] = polygon[(i + 1) % polygon.length]!;
    const cross = x1 * z2 - x2 * z1;
    cx += (x1 + x2) * cross;
    cz += (z1 + z2) * cross;
  }
  const factor = 1 / (6 * area);
  return [cx * factor, cz * factor];
}

export function findFloorplanRoom(id: string): FloorplanRoomGeometry | undefined {
  return WE28_FLOORPLAN_ROOMS.find((room) => room.id === id);
}
