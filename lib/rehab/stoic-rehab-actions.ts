"use server";

import { createClient, getSessionUser } from "@/lib/supabase/server";
import type { StoicRehabProcessScore } from "@/types/stoic-rehab";

export type SaveStoicRehabCompletionInput = {
  exerciseId: string;
  journalText?: string;
  processScore?: StoicRehabProcessScore;
  adapted?: boolean;
};

export async function saveStoicRehabCompletion(
  input: SaveStoicRehabCompletionInput,
): Promise<
  | { ok: true; id: string; completedAt: string }
  | { ok: false; message: string }
> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, message: "Sign in to save progress." };
  }

  const supabase = await createClient();
  const completedAt = new Date().toISOString();
  const journalText = input.journalText?.trim() ?? "";

  const { data, error } = await supabase
    .from("rehab_stoic_completions")
    .upsert(
      {
        user_id: user.id,
        exercise_id: input.exerciseId,
        completed_at: completedAt,
        journal_text: journalText.length > 0 ? journalText : null,
        process_score: input.processScore ?? null,
        adapted: input.adapted ?? false,
      },
      { onConflict: "user_id,exercise_id" },
    )
    .select("id, completed_at")
    .single();

  if (error) {
    return { ok: false, message: error.message };
  }

  return {
    ok: true,
    id: data.id,
    completedAt: data.completed_at,
  };
}

export async function clearStoicRehabCompletion(
  exerciseId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, message: "Sign in to save progress." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("rehab_stoic_completions")
    .delete()
    .eq("user_id", user.id)
    .eq("exercise_id", exerciseId);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}
