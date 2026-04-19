"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/config/routes";
import { canUseDevMenu, isDevMenuEmail } from "@/lib/dev/dev-access";
import { createClient } from "@/lib/supabase/server";

export type DevMenuToggleResult =
  | { ok: true }
  | { ok: false; message: string };

export async function updateDevMenuEnabled(
  enabled: boolean,
): Promise<DevMenuToggleResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !isDevMenuEmail(user.email)) {
    return { ok: false, message: "Not allowed." };
  }

  const { error } = await supabase.auth.updateUser({
    data: { dev_menu_enabled: enabled },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(ROUTES.settings);
  revalidatePath(ROUTES.dev);
  revalidatePath(ROUTES.dashboard, "layout");

  return { ok: true };
}

/** Whether the signed-in user may open Dev routes (used by server pages/API). */
export async function getDevMenuAccess(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return canUseDevMenu(user);
}
