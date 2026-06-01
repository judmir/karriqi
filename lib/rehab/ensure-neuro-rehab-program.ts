import { ensureRehabWikiPagesSeeded } from "@/lib/rehab/fetch-rehab-wiki";
import { materializeNeuroRehabProgramForUser } from "@/lib/rehab/materialize-neuro-rehab-program";

/** Idempotent: seed wiki (global) + 12-week calendar events (per user). */
export async function ensureNeuroRehabProgramReady(userId: string): Promise<void> {
  await ensureRehabWikiPagesSeeded();
  const result = await materializeNeuroRehabProgramForUser(userId);
  if (!result.ok) {
    throw new Error(result.message);
  }
}
