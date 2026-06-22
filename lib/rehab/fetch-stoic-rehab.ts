import { createClient } from "@/lib/supabase/server";
import type { StoicRehabCompletion, StoicRehabProcessScore } from "@/types/stoic-rehab";

function mapCompletionRow(row: {
  id: string;
  user_id: string;
  exercise_id: string;
  completed_at: string;
  journal_text: string | null;
  process_score: number | null;
  adapted: boolean;
}): StoicRehabCompletion {
  return {
    id: row.id,
    userId: row.user_id,
    exerciseId: row.exercise_id,
    completedAt: row.completed_at,
    journalText: row.journal_text ?? undefined,
    processScore:
      row.process_score == null
        ? undefined
        : (row.process_score as StoicRehabProcessScore),
    adapted: row.adapted,
  };
}

export async function fetchStoicRehabCompletionsForUser(
  userId: string,
): Promise<StoicRehabCompletion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rehab_stoic_completions")
    .select(
      "id, user_id, exercise_id, completed_at, journal_text, process_score, adapted",
    )
    .eq("user_id", userId)
    .order("completed_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapCompletionRow);
}

export async function fetchStoicRehabCompletionForExercise(
  userId: string,
  exerciseId: string,
): Promise<StoicRehabCompletion | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rehab_stoic_completions")
    .select(
      "id, user_id, exercise_id, completed_at, journal_text, process_score, adapted",
    )
    .eq("user_id", userId)
    .eq("exercise_id", exerciseId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapCompletionRow(data) : null;
}
