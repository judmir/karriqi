"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/config/routes";
import { defaultJournalTemplate } from "@/modules/rehab/neuro-rehab-2026/journal-template";
import { createClient } from "@/lib/supabase/server";

function parseEntryDate(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return value;
}

export async function getJournalEntry(entryDate: string): Promise<{
  entryDate: string;
  body: string;
  exists: boolean;
}> {
  const parsed = parseEntryDate(entryDate);
  if (!parsed) {
    throw new Error("Invalid date.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not signed in.");
  }

  const { data, error } = await supabase
    .from("rehab_journal_entries")
    .select("body")
    .eq("user_id", user.id)
    .eq("entry_date", parsed)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data) {
    return { entryDate: parsed, body: data.body, exists: true };
  }

  return {
    entryDate: parsed,
    body: defaultJournalTemplate(parsed),
    exists: false,
  };
}

export type SaveJournalEntryResult = { ok: true } | { ok: false; message: string };

export async function saveJournalEntry(input: {
  entryDate: string;
  body: string;
}): Promise<SaveJournalEntryResult> {
  const parsed = parseEntryDate(input.entryDate);
  if (!parsed) {
    return { ok: false, message: "Invalid date." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const { error } = await supabase.from("rehab_journal_entries").upsert(
    {
      user_id: user.id,
      entry_date: parsed,
      body: input.body,
    },
    { onConflict: "user_id,entry_date" },
  );

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(ROUTES.rehabJournal);
  revalidatePath(ROUTES.rehabToday);
  return { ok: true };
}
