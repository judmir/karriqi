"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/config/routes";
import { isAvatarPresetId } from "@/lib/avatar/presets";
import { createClient } from "@/lib/supabase/server";

export type UpdateDisplayNameResult =
  | { ok: true }
  | { ok: false; message: string };

export type UpdateAvatarPresetResult =
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

/**
 * Stores the chosen preset id (or `null` to clear) on
 * `auth.users.user_metadata.avatar_preset`. Invalid ids are rejected
 * server-side so a stale client cannot poison the profile.
 */
export async function updateProfileAvatarPreset(
  presetId: string | null,
): Promise<UpdateAvatarPresetResult> {
  if (presetId !== null && !isAvatarPresetId(presetId)) {
    return { ok: false, message: "Unknown avatar preset." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const { error } = await supabase.auth.updateUser({
    data: { avatar_preset: presetId },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(ROUTES.settings);
  revalidatePath(ROUTES.todo, "layout");
  revalidatePath("/", "layout");

  return { ok: true };
}
