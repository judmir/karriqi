"use server";

import {
  ROOM_LAYOUT_JSON_SCHEMA,
  parseRoomLayout,
} from "@/lib/home/design-schema";
import { validateLayout } from "@/lib/home/layout-validation";
import { mapDesignRow, mapRenderRow } from "@/lib/home/map-home-rows";
import {
  createStructuredCompletion,
  generateImageBytes,
} from "@/lib/home/openai-client";
import { getDecryptedOpenAiKey } from "@/lib/home/openai-key-store";
import { getRoom } from "@/modules/home/cicerostrasse-we28";
import type { Room } from "@/modules/home/apartment-model";
import { DOOR_CLEARANCE_CM } from "@/lib/home/layout-validation";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import type { Json } from "@/types/database";
import type { DesignRender, RoomDesign, RoomLayout } from "@/types/home";

const RENDERS_BUCKET = "home-renders";

export type GenerateDesignResult =
  | { ok: true; design: RoomDesign }
  | { ok: false; message: string };

export type GenerateRenderResult =
  | { ok: true; render: DesignRender }
  | { ok: false; message: string };

function describeRoom(room: Room): string {
  const openings = room.openings
    .map(
      (o) =>
        `- ${o.kind} on the ${o.wall} wall, ${o.widthCm} cm wide, starting ${o.offsetCm} cm from the wall's start corner`,
    )
    .join("\n");
  return [
    `Room: ${room.name} (${room.nameEn}).`,
    `Interior size: EXACTLY ${room.widthCm} cm wide (x-axis) by ${room.depthCm} cm deep (y-axis). Area ${room.officialAreaM2} m². Ceiling ${room.ceilingHeightCm} cm.`,
    `Coordinate system: origin (0,0) at the top-left corner, x increases to the right (max ${room.widthCm}), y increases downward (max ${room.depthCm}). All values in centimeters.`,
    `Fixed openings (never move or resize these):`,
    openings || "- (none specified)",
  ].join("\n");
}

const SYSTEM_PROMPT = [
  "You are an interior layout planner. You place furniture inside a room whose",
  "geometry is FIXED and provided by the app. Absolute rules:",
  "1. NEVER change the room dimensions, walls, doors, or windows.",
  "2. Every furniture footprint (xCm,yCm top-left plus widthCm/depthCm) must lie",
  "   fully within the room bounds.",
  "3. Furniture must not overlap other furniture.",
  `4. Keep at least ${DOOR_CLEARANCE_CM} cm clear in front of every door.`,
  "5. Use realistic furniture dimensions in centimeters.",
  "6. rotationDeg must be one of 0, 90, 180, 270.",
  "7. For every item, suggest a REAL purchasable product in `product` and the",
  "   store in `retailer`. If the user names a brand or store (e.g. IKEA),",
  "   use real current products from that store whose dimensions match the",
  "   footprint you place (e.g. product: 'KIVIK 3-seat sofa', retailer:",
  "   'IKEA'). Otherwise pick well-known products or set both to null.",
  "Return ONLY the structured layout. xCm/yCm are the top-left of the footprint",
  "in the room's coordinate system.",
].join(" ");

async function requestLayout(
  apiKey: string,
  room: Room,
  prompt: string,
  priorIssues: string[],
): Promise<RoomLayout | null> {
  const retryNote =
    priorIssues.length > 0
      ? `\n\nYour previous attempt had these problems — fix ALL of them:\n${priorIssues
          .map((i) => `- ${i}`)
          .join("\n")}`
      : "";

  const userPrompt = [
    describeRoom(room),
    "",
    `Design brief from the user: ${prompt}`,
    retryNote,
  ].join("\n");

  const result = await createStructuredCompletion({
    apiKey,
    system: SYSTEM_PROMPT,
    user: userPrompt,
    schemaName: "room_layout",
    schema: ROOM_LAYOUT_JSON_SCHEMA,
  });
  if (!result.ok) {
    return null;
  }
  return parseRoomLayout(result.data);
}

function deriveTitle(prompt: string, room: Room): string {
  const clean = prompt.trim().replace(/\s+/g, " ");
  if (!clean) return `${room.name} design`;
  return clean.length <= 60 ? clean : `${clean.slice(0, 57)}…`;
}

/** Generate an AI furnishing layout for a room, validated against its geometry. */
export async function generateRoomDesign(
  roomId: string,
  prompt: string,
): Promise<GenerateDesignResult> {
  const trimmedPrompt = prompt.trim();
  if (trimmedPrompt.length < 3) {
    return { ok: false, message: "Describe how you want the room furnished." };
  }

  const room = getRoom(roomId);
  if (!room) {
    return { ok: false, message: "Unknown room." };
  }
  if (!room.furnishable) {
    return { ok: false, message: `${room.name} cannot be furnished.` };
  }

  const user = await getSessionUser();
  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const apiKey = await getDecryptedOpenAiKey(user.id);
  if (!apiKey) {
    return {
      ok: false,
      message: "Add your OpenAI API key in Settings to use AI design.",
    };
  }

  let layout = await requestLayout(apiKey, room, trimmedPrompt, []);
  if (!layout) {
    return {
      ok: false,
      message: "The AI response could not be parsed. Try again.",
    };
  }

  let { valid, issues } = validateLayout(room, layout);
  if (!valid) {
    const retry = await requestLayout(apiKey, room, trimmedPrompt, issues);
    if (retry) {
      const retryCheck = validateLayout(room, retry);
      // Keep whichever attempt has fewer issues.
      if (retryCheck.issues.length <= issues.length) {
        layout = retry;
        valid = retryCheck.valid;
        issues = retryCheck.issues;
      }
    }
  }

  const warnings = valid ? [] : issues;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("home_room_designs")
    .insert({
      user_id: user.id,
      room_id: room.id,
      apartment_id: "cicerostrasse-we28",
      title: deriveTitle(trimmedPrompt, room),
      style_prompt: trimmedPrompt,
      layout: layout as unknown as Json,
      warnings: warnings as unknown as Json,
      status: "draft",
    })
    .select(
      "id, room_id, apartment_id, title, style_prompt, layout, warnings, status, created_at, updated_at",
    )
    .single();

  if (error || !data) {
    return {
      ok: false,
      message: error?.message ?? "Could not save the design.",
    };
  }

  return { ok: true, design: mapDesignRow(data) };
}

function buildRenderPrompt(room: Room, layout: RoomLayout): string {
  const items = layout.furniture
    .map((f) => {
      const parts = [f.label];
      if (f.product) {
        parts.push(
          f.retailer ? `${f.retailer} ${f.product}` : f.product,
        );
      }
      parts.push(`${f.widthCm}×${f.depthCm} cm`);
      if (f.material) parts.push(f.material);
      if (f.color) parts.push(f.color);
      const wall = describePosition(room, f);
      return `- ${parts.join(", ")} — ${wall}`;
    })
    .join("\n");

  const windows = room.openings.filter((o) => o.kind === "window");
  const windowNote =
    windows.length > 0
      ? `Daylight comes through ${windows.length === 1 ? "a window" : `${windows.length} windows`} on the ${[...new Set(windows.map((w) => w.wall))].join(" and ")} wall${windows.length > 1 ? "s" : ""}.`
      : "Soft warm artificial lighting.";

  return [
    `Photorealistic interior photograph of a real ${room.nameEn.toLowerCase()} in a renovated Berlin Altbau apartment.`,
    `The room is ${(room.widthCm / 100).toFixed(2)} m wide by ${(room.depthCm / 100).toFixed(2)} m deep with ${(room.ceilingHeightCm / 100).toFixed(1)} m ceilings — keep these true proportions.`,
    `Interior style: ${layout.styleSummary || "warm contemporary"}.`,
    windowNote,
    "Furnished with (keep placement and true-to-scale sizes):",
    items || "- (empty room, freshly renovated)",
    "Shot at eye level with a 24mm wide-angle lens from the doorway, natural",
    "daylight, realistic materials and textures, oak parquet floor, white",
    "walls, magazine-quality interior photography. Absolutely no text, labels,",
    "watermarks, people, or dimension lines.",
  ].join("\n");
}

/** Rough human placement description for the render prompt. */
function describePosition(room: Room, f: RoomLayout["furniture"][number]): string {
  const cx = f.xCm + f.widthCm / 2;
  const cy = f.yCm + f.depthCm / 2;
  const horizontal =
    cx < room.widthCm / 3 ? "left" : cx > (room.widthCm * 2) / 3 ? "right" : "center";
  const vertical =
    cy < room.depthCm / 3 ? "back" : cy > (room.depthCm * 2) / 3 ? "front" : "middle";
  if (horizontal === "center" && vertical === "middle") return "in the middle of the room";
  return `at the ${vertical} ${horizontal} of the room`;
}

/** Generate an inspiration render image for a saved design. */
export async function generateDesignRender(
  designId: string,
): Promise<GenerateRenderResult> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const apiKey = await getDecryptedOpenAiKey(user.id);
  if (!apiKey) {
    return {
      ok: false,
      message: "Add your OpenAI API key in Settings to generate renders.",
    };
  }

  const supabase = await createClient();
  const { data: design, error: designError } = await supabase
    .from("home_room_designs")
    .select("id, room_id, layout")
    .eq("id", designId)
    .is("deleted_at", null)
    .single();

  if (designError || !design) {
    return { ok: false, message: "Design not found." };
  }

  const room = getRoom(design.room_id);
  const layout = parseRoomLayout(design.layout) ?? {
    styleSummary: "",
    furniture: [],
  };
  if (!room) {
    return { ok: false, message: "Unknown room for this design." };
  }

  const prompt = buildRenderPrompt(room, layout);
  // Landscape format suits eye-level interior photography.
  const image = await generateImageBytes({ apiKey, prompt, size: "1536x1024" });
  if (!image.ok) {
    return { ok: false, message: image.message };
  }

  const renderId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}`;
  const storagePath = `${user.id}/${designId}/${renderId}.png`;

  const { error: uploadError } = await supabase.storage
    .from(RENDERS_BUCKET)
    .upload(storagePath, image.data, {
      contentType: "image/png",
      upsert: false,
    });
  if (uploadError) {
    return { ok: false, message: uploadError.message };
  }

  const { data: renderRow, error: insertError } = await supabase
    .from("home_design_renders")
    .insert({
      design_id: designId,
      user_id: user.id,
      prompt,
      storage_path: storagePath,
    })
    .select("id, design_id, prompt, created_at")
    .single();

  if (insertError || !renderRow) {
    return {
      ok: false,
      message: insertError?.message ?? "Could not save the render.",
    };
  }

  const { data: signed } = await supabase.storage
    .from(RENDERS_BUCKET)
    .createSignedUrl(storagePath, 60 * 60);

  return {
    ok: true,
    render: mapRenderRow(renderRow, signed?.signedUrl ?? null),
  };
}
