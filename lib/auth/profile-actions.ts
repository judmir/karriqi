"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/config/routes";
import {
  PROFILE_COLOR_META_KEY,
  isProfileColorId,
} from "@/lib/profile/colors";
import { createClient } from "@/lib/supabase/server";

export type UpdateDisplayNameResult =
  | { ok: true }
  | { ok: false; message: string };

const MAX_LEN = 80;

export async function updateProfileDisplayName(
  displayName: string,
): Promise<UpdateDisplayNameResult> {
  const name = displayName.trim();
  if (!name) {
    return { ok: false, message: "Display name is required." };
  }
  if (name.length > MAX_LEN) {
    return { ok: false, message: `Use at most ${MAX_LEN} characters.` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const { error } = await supabase.auth.updateUser({
    data: { display_name: name },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(ROUTES.settings);
  revalidatePath(ROUTES.todo, "layout");

  return { ok: true };
}

export type UpdateProfileColorResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Persists the user's chosen profile color and back-fills the snapshot on
 * every shopping list row they have already added so the in-list highlight
 * stays in sync with their current pick. Passing `null` clears the color.
 */
export async function updateProfileColor(
  color: string | null,
): Promise<UpdateProfileColorResult> {
  if (color !== null && !isProfileColorId(color)) {
    return { ok: false, message: "Unknown color." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const { error: metaError } = await supabase.auth.updateUser({
    data: { [PROFILE_COLOR_META_KEY]: color },
  });

  if (metaError) {
    return { ok: false, message: metaError.message };
  }

  // Keep the snapshot on the user's own shopping list rows aligned with
  // their current choice. Failures here are non-fatal — the metadata is
  // already saved and future inserts will use the new color.
  const { error: backfillError } = await supabase
    .from("shopping_list_items")
    .update({ created_by_color: color })
    .eq("user_id", user.id);

  if (backfillError) {
    return { ok: false, message: backfillError.message };
  }

  revalidatePath(ROUTES.settings);
  revalidatePath(ROUTES.shopping);

  return { ok: true };
}
