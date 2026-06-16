import { STOIC_WEEKLY_REVIEW_TITLE } from "@/modules/rehab/neuro-rehab-2026/stoic-content";
import type { RehabPlanEvent } from "@/types/rehab";

/**
 * Per-occurrence Stoic responses.
 *
 * A Stoic event is a recurring master (see generate-program-events.ts). When the
 * user logs an answer for one day, we persist it on that occurrence's override
 * row (series_id + recurrence_at) — the same mechanism used for completion/edits,
 * so no schema change is needed.
 *
 * The structured answer (Yes/Partial/No per check item + an optional note) is
 * stored as JSON behind a metadata marker so the original prompt is preserved.
 * The payload is URI-encoded so it can't contain spaces or the `-->` sequence.
 * `getEventDescriptionPlainText` already strips any `karriqi-*` marker, so the
 * prompt renders cleanly while the answer is read back out here.
 */
const STOIC_RESPONSE_MARKER = /<!-- karriqi-stoic-response:([\s\S]*?) -->/;

export type StoicCheckValue = "yes" | "partial" | "no";

export const STOIC_CHECK_VALUES: StoicCheckValue[] = ["yes", "partial", "no"];

export const STOIC_CHECK_LABELS: Record<StoicCheckValue, string> = {
  yes: "Yes",
  partial: "Partial",
  no: "No",
};

export type StoicResponseData = {
  /** Answer per check item id. */
  checks: Record<string, StoicCheckValue>;
  /** Optional free-text reflection. */
  note: string;
};

export function emptyStoicResponse(): StoicResponseData {
  return { checks: {}, note: "" };
}

export function isStoicEvent(event: { eventKind: string }): boolean {
  return event.eventKind === "stoic";
}

/** Weekly review uses the structured Stoic dialog; daily intention uses the default event form. */
export function isStoicDialogEvent(event: {
  eventKind: string;
  title: string;
}): boolean {
  return isStoicEvent(event) && event.title === STOIC_WEEKLY_REVIEW_TITLE;
}

export function isStoicResponseEmpty(data: StoicResponseData): boolean {
  return (
    Object.keys(data.checks).length === 0 && data.note.trim().length === 0
  );
}

function decodeMarker(raw: string): StoicResponseData {
  let decoded = "";
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }
  // Current format: JSON { checks, note }. Legacy rows stored plain note text.
  try {
    const parsed = JSON.parse(decoded) as Partial<StoicResponseData> | null;
    if (
      parsed &&
      typeof parsed === "object" &&
      ("checks" in parsed || "note" in parsed)
    ) {
      const checks: Record<string, StoicCheckValue> = {};
      for (const [key, value] of Object.entries(parsed.checks ?? {})) {
        if (value === "yes" || value === "partial" || value === "no") {
          checks[key] = value;
        }
      }
      return {
        checks,
        note: typeof parsed.note === "string" ? parsed.note : "",
      };
    }
  } catch {
    // Not JSON — fall through to legacy plain-text note.
  }
  return { checks: {}, note: decoded };
}

/** Split a stored description into its prompt and the structured answer. */
export function parseStoicResponse(description: string | null | undefined): {
  prompt: string;
  data: StoicResponseData;
} {
  if (!description) {
    return { prompt: "", data: emptyStoicResponse() };
  }
  const match = description.match(STOIC_RESPONSE_MARKER);
  if (!match || match.index === undefined) {
    return { prompt: description.trimEnd(), data: emptyStoicResponse() };
  }
  const prompt = description.slice(0, match.index).trimEnd();
  return { prompt, data: decodeMarker(match[1]) };
}

export function getStoicResponseData(
  description: string | null | undefined,
): StoicResponseData {
  return parseStoicResponse(description).data;
}

export function hasStoicResponse(
  description: string | null | undefined,
): boolean {
  return !isStoicResponseEmpty(getStoicResponseData(description));
}

/** Rebuild a description from its prompt + answer (marker dropped when empty). */
export function serializeStoicResponse(
  prompt: string,
  data: StoicResponseData,
): string {
  const trimmedPrompt = prompt.trimEnd();
  const clean: StoicResponseData = {
    checks: data.checks,
    note: data.note.trim(),
  };
  if (isStoicResponseEmpty(clean)) {
    return trimmedPrompt;
  }
  const encoded = encodeURIComponent(JSON.stringify(clean));
  return `${trimmedPrompt}\n\n<!-- karriqi-stoic-response:${encoded} -->`;
}

/** A short one-line summary for previews and history rows. */
export function summarizeStoicResponse(data: StoicResponseData): string {
  const counts = { yes: 0, partial: 0, no: 0 };
  for (const value of Object.values(data.checks)) {
    counts[value] += 1;
  }
  const parts: string[] = [];
  if (counts.yes) parts.push(`${counts.yes} yes`);
  if (counts.partial) parts.push(`${counts.partial} partial`);
  if (counts.no) parts.push(`${counts.no} no`);
  const checksLabel = parts.join(" · ");
  const note = data.note.trim();
  if (checksLabel && note) {
    return `${checksLabel} — ${note}`;
  }
  return checksLabel || note;
}

export type StoicResponseHistoryEntry = {
  /** Override row id (stable key). */
  id: string;
  /** Original occurrence start (the day this answer belongs to). */
  occurrenceAt: string;
  data: StoicResponseData;
  completed: boolean;
};

/**
 * All saved answers for the same Stoic series the event belongs to, newest
 * first. Series are grouped by title (each 2-week block is its own master, but
 * they share the title "Stoic intention").
 */
export function collectStoicResponseHistory(
  events: RehabPlanEvent[],
  event: Pick<RehabPlanEvent, "title" | "eventKind">,
): StoicResponseHistoryEntry[] {
  return events
    .filter(
      (item) =>
        isStoicEvent(item) &&
        item.title === event.title &&
        item.recurrenceAt !== null &&
        hasStoicResponse(item.description),
    )
    .map((item) => ({
      id: item.id,
      occurrenceAt: item.recurrenceAt as string,
      data: getStoicResponseData(item.description),
      completed: Boolean(item.completedAt),
    }))
    .sort(
      (a, b) =>
        new Date(b.occurrenceAt).getTime() - new Date(a.occurrenceAt).getTime(),
    );
}
