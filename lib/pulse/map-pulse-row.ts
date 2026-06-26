import type { Database } from "@/types/database";
import type { PulseItem } from "@/types/pulse";
import {
  PULSE_CATEGORIES,
  PULSE_IMPACTS,
  PULSE_SOURCE_TYPES,
  PULSE_STATUSES,
  PULSE_URGENCIES,
} from "@/types/pulse";

type PulseRow = Database["public"]["Tables"]["pulse_items"]["Row"];

function asEnum<T extends readonly string[]>(
  values: T,
  value: string,
): T[number] {
  if ((values as readonly string[]).includes(value)) {
    return value as T[number];
  }
  throw new Error(`Invalid pulse enum value: ${value}`);
}

export function mapPulseRow(row: PulseRow): PulseItem {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    summary: row.summary,
    whyItMatters: row.why_it_matters,
    suggestedAction: row.suggested_action,
    category: asEnum(PULSE_CATEGORIES, row.category),
    impact: asEnum(PULSE_IMPACTS, row.impact),
    urgency: asEnum(PULSE_URGENCIES, row.urgency),
    status: asEnum(PULSE_STATUSES, row.status),
    sourceType: asEnum(PULSE_SOURCE_TYPES, row.source_type),
    sourceUrl: row.source_url,
    sourceTitle: row.source_title,
    startsAt: row.starts_at,
    dueAt: row.due_at,
    expiresAt: row.expires_at,
    dedupeKey: row.dedupe_key,
    confidence: row.confidence,
    payload:
      row.payload && typeof row.payload === "object" && !Array.isArray(row.payload)
        ? (row.payload as Record<string, unknown>)
        : {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
