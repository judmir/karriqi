"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/config/routes";
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
