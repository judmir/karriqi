"use server";

import { softDeletePatch } from "@/lib/db/soft-delete";
import { createClient } from "@/lib/supabase/server";

export type HomeActionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function renameDesign(
  id: string,
  title: string,
): Promise<HomeActionResult> {
  const trimmed = title.trim();
  if (!trimmed) {
    return { ok: false, message: "Title cannot be empty." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("home_room_designs")
    .update({ title: trimmed })
    .eq("id", id)
    .is("deleted_at", null);
  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
}

export async function setDesignStatus(
  id: string,
  status: "draft" | "saved",
): Promise<HomeActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("home_room_designs")
    .update({ status })
    .eq("id", id)
    .is("deleted_at", null);
  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
}

export async function deleteDesign(id: string): Promise<HomeActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("home_room_designs")
    .update(softDeletePatch())
    .eq("id", id)
    .is("deleted_at", null);
  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
}
