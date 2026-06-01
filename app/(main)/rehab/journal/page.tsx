import { redirect } from "next/navigation";

import { RehabJournalEditor } from "@/components/rehab/rehab-journal-editor";
import { defaultJournalTemplate } from "@/modules/rehab/neuro-rehab-2026/journal-template";
import { ROUTES } from "@/config/routes";
import { getJournalEntry } from "@/lib/rehab/journal-actions";
import { formatJournalDateParam } from "@/lib/rehab/journal-utils";
import { isSupabaseConfigured } from "@/lib/env";
import { getSessionUser } from "@/lib/supabase/server";

type RehabJournalPageProps = {
  searchParams: Promise<{ date?: string }>;
};

export default async function RehabJournalPage({ searchParams }: RehabJournalPageProps) {
  const params = await searchParams;
  const today = formatJournalDateParam(new Date());
  const entryDate = params.date ?? today;

  if (!isSupabaseConfigured()) {
    return (
      <RehabJournalEditor
        entryDate={entryDate}
        initialBody={defaultJournalTemplate(entryDate)}
        persistence={false}
      />
    );
  }

  const user = await getSessionUser();
  if (!user) {
    redirect(
      `${ROUTES.signIn}?next=${encodeURIComponent(`${ROUTES.rehabJournal}?date=${entryDate}`)}`,
    );
  }

  const entry = await getJournalEntry(entryDate);

  return (
    <RehabJournalEditor
      entryDate={entry.entryDate}
      initialBody={entry.body}
      persistence
    />
  );
}
