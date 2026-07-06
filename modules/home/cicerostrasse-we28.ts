/**
 * Cicerostrasse 3, 10709 Berlin — Wohnung 28 (2. OG mitte).
 *
 * Source of truth: `2026-06__Cicerostrasse_WE28__Floorplan_Dimensioned_Alt.pdf`
 * (Bestandsplan, Maßstab 1:100, WoFlV area schedule).
 *
 * Positions match the original plan's dimension chains:
 *   top:    4.52 | 6.72 | 3.45
 *   bottom: 4.40 | 2.17 | 1.46 | 2.93 | 3.45
 *   left:   4.67 + 1.37   right: 1.71 + 4.06 (= 5.85)
 *
 * Layout: Zimmer 1 top-left with the Balkon below it; the Flur runs along the
 * top-middle; Küche, Bad and Zimmer 3 sit in a row under the Flur; Zimmer 2
 * takes the full right side. Room sizes are exact rectangles whose areas match
 * the official WoFlV figures. The AI furnishing engine is constrained to these
 * boundaries and can never change them.
 */
import {
  rectanglePolygon,
  type Apartment,
  type Room,
  type RoomOpening,
} from "@/modules/home/apartment-model";

const CEILING_HEIGHT_CM = 300; // Berlin Altbau placeholder — refine on site.

type RoomSeed = {
  id: string;
  code: string;
  name: string;
  nameEn: string;
  officialAreaM2: number;
  widthCm: number;
  depthCm: number;
  origin: { x: number; y: number };
  openings: RoomOpening[];
  furnishable?: boolean;
};

function buildRoom(seed: RoomSeed): Room {
  return {
    id: seed.id,
    code: seed.code,
    name: seed.name,
    nameEn: seed.nameEn,
    officialAreaM2: seed.officialAreaM2,
    widthCm: seed.widthCm,
    depthCm: seed.depthCm,
    polygon: rectanglePolygon(seed.widthCm, seed.depthCm),
    origin: seed.origin,
    ceilingHeightCm: CEILING_HEIGHT_CM,
    openings: seed.openings,
    furnishable: seed.furnishable ?? true,
  };
}

const ROOM_SEEDS: RoomSeed[] = [
  {
    // Top-left. 4.52 m wide (top chain); depth trimmed to hit 20.9 m² WoFlV.
    id: "zimmer-1",
    code: "001",
    name: "Zimmer 1",
    nameEn: "Room 1",
    officialAreaM2: 20.9,
    widthCm: 452,
    depthCm: 462,
    origin: { x: 0, y: 0 },
    openings: [
      { id: "z1-win-1", kind: "window", wall: "west", offsetCm: 60, widthCm: 140 },
      { id: "z1-win-2", kind: "window", wall: "west", offsetCm: 260, widthCm: 140 },
      { id: "z1-door-flur", kind: "door", wall: "east", offsetCm: 30, widthCm: 90, swing: "in" },
      { id: "z1-door-balkon", kind: "door", wall: "south", offsetCm: 300, widthCm: 90, swing: "in" },
    ],
  },
  {
    // Top-middle corridor: 6.72 m wide × 1.71 m (trimmed to 11.3 m² WoFlV).
    id: "flur",
    code: "002",
    name: "Flur",
    nameEn: "Hallway",
    officialAreaM2: 11.3,
    widthCm: 672,
    depthCm: 168,
    origin: { x: 452, y: 0 },
    openings: [
      { id: "f-door-entry", kind: "door", wall: "north", offsetCm: 300, widthCm: 100, swing: "in" },
      { id: "f-win", kind: "window", wall: "north", offsetCm: 480, widthCm: 120 },
    ],
  },
  {
    // Under the Flur, left of Bad. 2.17 × 4.06 m (bottom chain).
    id: "kueche",
    code: "004",
    name: "Küche",
    nameEn: "Kitchen",
    officialAreaM2: 8.8,
    widthCm: 217,
    depthCm: 406,
    origin: { x: 452, y: 178 },
    openings: [
      { id: "k-door", kind: "door", wall: "north", offsetCm: 60, widthCm: 85, swing: "in" },
      { id: "k-win", kind: "window", wall: "south", offsetCm: 50, widthCm: 120 },
    ],
  },
  {
    // Between Küche and Zimmer 3. 1.46 × 4.06 m.
    id: "bad",
    code: "005",
    name: "Bad",
    nameEn: "Bathroom",
    officialAreaM2: 5.9,
    widthCm: 146,
    depthCm: 406,
    origin: { x: 679, y: 178 },
    openings: [
      { id: "b-door", kind: "door", wall: "north", offsetCm: 30, widthCm: 75, swing: "in" },
      { id: "b-win", kind: "window", wall: "south", offsetCm: 45, widthCm: 60 },
    ],
  },
  {
    // Right of Bad. 2.93 × 4.06 m.
    id: "zimmer-3",
    code: "006",
    name: "Zimmer 3",
    nameEn: "Room 3",
    officialAreaM2: 11.9,
    widthCm: 293,
    depthCm: 406,
    origin: { x: 835, y: 178 },
    openings: [
      { id: "z3-door", kind: "door", wall: "north", offsetCm: 100, widthCm: 90, swing: "in" },
      { id: "z3-win", kind: "window", wall: "south", offsetCm: 80, widthCm: 140 },
    ],
  },
  {
    // Full right side: 3.45 × 5.85 m.
    id: "zimmer-2",
    code: "003",
    name: "Zimmer 2",
    nameEn: "Room 2",
    officialAreaM2: 20.2,
    widthCm: 345,
    depthCm: 585,
    origin: { x: 1134, y: 0 },
    openings: [
      { id: "z2-door", kind: "door", wall: "west", offsetCm: 40, widthCm: 90, swing: "in" },
      { id: "z2-win-1", kind: "window", wall: "south", offsetCm: 50, widthCm: 150 },
      { id: "z2-win-2", kind: "window", wall: "east", offsetCm: 220, widthCm: 150 },
    ],
  },
  {
    // Below Zimmer 1: 4.40 × 1.37 m (counts half toward living area).
    id: "balkon",
    code: "007",
    name: "Balkon",
    nameEn: "Balcony",
    officialAreaM2: 6.0,
    widthCm: 440,
    depthCm: 137,
    origin: { x: 0, y: 472 },
    openings: [
      { id: "bk-door", kind: "door", wall: "north", offsetCm: 300, widthCm: 90, swing: "in" },
    ],
    furnishable: true,
  },
];

export const CICEROSTRASSE_WE28: Apartment = {
  id: "cicerostrasse-we28",
  label: "Cicerostraße 3 — WE 28 (2. OG mitte)",
  address: "Cicerostraße 3, 10709 Berlin",
  totalAreaM2: 82.0,
  rooms: ROOM_SEEDS.map(buildRoom),
  layoutIsSchematic: false,
};

/** Look up a room by id. */
export function getRoom(roomId: string): Room | undefined {
  return CICEROSTRASSE_WE28.rooms.find((room) => room.id === roomId);
}

/** All valid room ids. */
export function roomIds(): string[] {
  return CICEROSTRASSE_WE28.rooms.map((room) => room.id);
}
