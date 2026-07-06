import { parseRoomLayout } from "@/lib/home/design-schema";
import type { DesignRender, DesignStatus, RoomDesign } from "@/types/home";

type DesignRow = {
  id: string;
  room_id: string;
  apartment_id: string;
  title: string;
  style_prompt: string;
  layout: unknown;
  warnings: unknown;
  status: string;
  created_at: string;
  updated_at: string;
};

export function mapDesignRow(row: DesignRow): RoomDesign {
  const layout = parseRoomLayout(row.layout) ?? {
    styleSummary: "",
    furniture: [],
  };
  const warnings = Array.isArray(row.warnings)
    ? row.warnings.filter((w): w is string => typeof w === "string")
    : [];
  const status: DesignStatus = row.status === "saved" ? "saved" : "draft";
  return {
    id: row.id,
    roomId: row.room_id,
    apartmentId: row.apartment_id,
    title: row.title,
    stylePrompt: row.style_prompt,
    layout,
    warnings,
    status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type RenderRow = {
  id: string;
  design_id: string;
  prompt: string;
  created_at: string;
};

export function mapRenderRow(row: RenderRow, url: string | null): DesignRender {
  return {
    id: row.id,
    designId: row.design_id,
    prompt: row.prompt,
    url,
    createdAt: row.created_at,
  };
}
