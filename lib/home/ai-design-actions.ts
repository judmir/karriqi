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
      const parts = [f.label, `${f.widthCm}×${f.depthCm} cm`];
      if (f.material) parts.push(f.material);
      if (f.color) parts.push(f.color);
      return `- ${parts.join(", ")} at (${f.xCm}, ${f.yCm}) cm, rotated ${f.rotationDeg}°`;
    })
    .join("\n");

  return [
    `Top-down architectural render (floor plan view from directly above) of a ${room.nameEn.toLowerCase()}.`,
    `The room is a rectangle ${room.widthCm} cm by ${room.depthCm} cm. Do not change these proportions.`,
    `Style: ${layout.styleSummary || room.name}.`,
    "Furniture, placed to scale:",
    items || "- (empty room)",
    "Clean, realistic materials and lighting. No text, labels, or dimension lines.",
  ].join("\n");
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
  const image = await generateImageBytes({ apiKey, prompt });
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
