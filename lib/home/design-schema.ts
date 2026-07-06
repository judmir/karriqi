import { z } from "zod";

import type { FurnitureItem, RoomLayout } from "@/types/home";

/**
 * Zod schema for a furnishing layout. Also exported as a raw JSON schema for
 * OpenAI structured outputs, so the model must return exactly this shape.
 */
export const furnitureItemSchema = z.object({
  type: z.string().min(1).max(60),
  label: z.string().min(1).max(80),
  widthCm: z.number().positive().max(1000),
  depthCm: z.number().positive().max(1000),
  xCm: z.number().min(-100).max(2000),
  yCm: z.number().min(-100).max(2000),
  rotationDeg: z.number(),
  material: z.string().max(120).nullable().optional(),
  color: z.string().max(120).nullable().optional(),
});

export const roomLayoutSchema = z.object({
  styleSummary: z.string().min(1).max(600),
  furniture: z.array(furnitureItemSchema).max(40),
});

export function parseRoomLayout(value: unknown): RoomLayout | null {
  const result = roomLayoutSchema.safeParse(value);
  if (!result.success) return null;
  return normalizeLayout(result.data);
}

/** Snap rotation to the nearest 90° and coerce numbers to integers (cm). */
export function normalizeLayout(layout: RoomLayout): RoomLayout {
  return {
    styleSummary: layout.styleSummary.trim(),
    furniture: layout.furniture.map(normalizeFurniture),
  };
}

function normalizeFurniture(item: FurnitureItem): FurnitureItem {
  const rotation = ((Math.round(item.rotationDeg / 90) * 90) % 360 + 360) % 360;
  return {
    ...item,
    widthCm: Math.round(item.widthCm),
    depthCm: Math.round(item.depthCm),
    xCm: Math.round(item.xCm),
    yCm: Math.round(item.yCm),
    rotationDeg: rotation,
    material: item.material?.trim() || null,
    color: item.color?.trim() || null,
  };
}

/** JSON schema handed to OpenAI (structured output, strict mode). */
export const ROOM_LAYOUT_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["styleSummary", "furniture"],
  properties: {
    styleSummary: { type: "string" },
    furniture: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "type",
          "label",
          "widthCm",
          "depthCm",
          "xCm",
          "yCm",
          "rotationDeg",
          "material",
          "color",
        ],
        properties: {
          type: { type: "string" },
          label: { type: "string" },
          widthCm: { type: "number" },
          depthCm: { type: "number" },
          xCm: { type: "number" },
          yCm: { type: "number" },
          rotationDeg: { type: "number" },
          material: { type: ["string", "null"] },
          color: { type: ["string", "null"] },
        },
      },
    },
  },
};
