"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/config/routes";
import { createClient, getSessionUser } from "@/lib/supabase/server";

export async function toggleRehabClinicalItemCompleted(
  itemId: string,
  completed: boolean,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, message: "Sign in to save progress." };
  }

  const supabase = await createClient();
  const completedAt = completed ? new Date().toISOString() : null;

  const { error } = await supabase.from("rehab_clinical_item_state").upsert(
    {
      user_id: user.id,
      item_id: itemId,
      completed_at: completedAt,
    },
    { onConflict: "user_id,item_id" },
  );

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(ROUTES.rehabClinical);
  return { ok: true };
}

export async function updateRehabClinicalItemNotes(
  itemId: string,
  notes: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, message: "Sign in to save notes." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("rehab_clinical_item_state").upsert(
    {
      user_id: user.id,
      item_id: itemId,
      notes: notes.trim(),
    },
    { onConflict: "user_id,item_id" },
  );

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(ROUTES.rehabClinical);
  return { ok: true };
}

export async function updateRehabClinicalSubtasksDone(
  itemId: string,
  subtasksDone: number[],
  completed: boolean,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, message: "Sign in to save progress." };
  }

  const supabase = await createClient();
  const completedAt = completed ? new Date().toISOString() : null;

  const { error } = await supabase.from("rehab_clinical_item_state").upsert(
    {
      user_id: user.id,
      item_id: itemId,
      subtasks_done: subtasksDone,
      completed_at: completedAt,
    },
    { onConflict: "user_id,item_id" },
  );

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(ROUTES.rehabClinical);
  return { ok: true };
}
