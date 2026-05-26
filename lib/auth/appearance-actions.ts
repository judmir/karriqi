"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/config/routes";
import { createClient } from "@/lib/supabase/server";
import {
  APPEARANCE_USER_META_KEY,
  sanitizeAppearanceState,
  type AppearanceState,
} from "@/lib/theme/appearance";

export type UpdateThemeAppearanceResult =
  | { ok: true }
  | { ok: false; message: string };

export async function updateThemeAppearance(
  appearance: AppearanceState,
): Promise<UpdateThemeAppearanceResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const sanitizedAppearance = sanitizeAppearanceState(appearance);
  const currentMetadata = (user.user_metadata ?? {}) as Record<string, unknown>;

  const { error } = await supabase.auth.updateUser({
    data: {
      ...currentMetadata,
      [APPEARANCE_USER_META_KEY]: sanitizedAppearance,
    },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/", "layout");
  revalidatePath(ROUTES.settings);

  return { ok: true };
}
