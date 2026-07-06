/**
 * Deterministic apartment geometry model. All measurements are in centimeters
 * with the origin at the top-left of the apartment overview (x → right,
 * y → down). Geometry is the single source of truth: the AI furnishing engine
 * may only propose furniture *inside* these fixed room boundaries — it can
 * never change room size, walls, doors, or windows.
 */

/** A point in centimeters. */
export type Point = { x: number; y: number };

/** A wall side of a rectangular room. */
export type WallSide = "north" | "east" | "south" | "west";

/** A door or window along one wall of a room. */
export type RoomOpening = {
  id: string;
  kind: "door" | "window";
  wall: WallSide;
  /** Distance (cm) from the wall's start corner to the opening's near edge. */
  offsetCm: number;
  /** Opening width (cm) measured along the wall. */
  widthCm: number;
  /** Door swing direction (doors only). */
  swing?: "in" | "out";
};

/**
 * A single room. `polygon` is expressed in the room's *local* coordinates
 * (origin at the room's top-left, before placement) so validation and
 * rendering can work in one space. `origin` places the room in the apartment
 * overview.
 */
export type Room = {
  id: string;
  /** Plan number, e.g. "001". */
  code: string;
  /** German label as printed on the plan, e.g. "Küche". */
  name: string;
  /** English helper label for the UI. */
  nameEn: string;
  /** Official Wohnflächenberechnung (WoFlV) area in m², from the plan. */
  officialAreaM2: number;
  /** Interior bounding-box width (cm). */
  widthCm: number;
  /** Interior bounding-box depth (cm). */
  depthCm: number;
  /** Room outline in local cm coordinates (rectangle corners, clockwise). */
  polygon: Point[];
  /** Top-left placement of the room in the apartment overview (cm). */
  origin: Point;
  /** Assumed ceiling height (cm) — Berlin Altbau placeholder, refine on site. */
  ceilingHeightCm: number;
  openings: RoomOpening[];
  /** Whether the AI may furnish this room (balconies/baths still selectable). */
  furnishable: boolean;
};

export type Apartment = {
  id: string;
  label: string;
  address: string;
  /** Official total living area (m²) from the plan. */
  totalAreaM2: number;
  rooms: Room[];
  /**
   * Room shapes are exact rectangles derived from the official area schedule
   * and dimension chains; relative positions in the overview are schematic
   * pending an exact polygon trace from the visual plan.
   */
  layoutIsSchematic: boolean;
};

/** Build a rectangle polygon (clockwise) in local coordinates. */
export function rectanglePolygon(widthCm: number, depthCm: number): Point[] {
  return [
    { x: 0, y: 0 },
    { x: widthCm, y: 0 },
    { x: widthCm, y: depthCm },
    { x: 0, y: depthCm },
  ];
}

/** Shoelace area of a polygon in square centimeters. */
export function polygonAreaCm2(points: Point[]): number {
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

/** Polygon area in square meters. */
export function polygonAreaM2(points: Point[]): number {
  return polygonAreaCm2(points) / 10_000;
}

/** Axis-aligned bounding box of a set of points. */
export function boundingBox(points: Point[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

/** Overview bounding box across all placed rooms (cm). */
export function apartmentBounds(apartment: Apartment) {
  const corners: Point[] = apartment.rooms.flatMap((room) =>
    room.polygon.map((p) => ({
      x: p.x + room.origin.x,
      y: p.y + room.origin.y,
    })),
  );
  return boundingBox(corners);
}

/** True when a point (local room coordinates) lies inside a rectangle room. */
export function isPointInRoom(room: Room, point: Point): boolean {
  const bounds = boundingBox(room.polygon);
  return (
    point.x >= bounds.minX &&
    point.x <= bounds.maxX &&
    point.y >= bounds.minY &&
    point.y <= bounds.maxY
  );
}
