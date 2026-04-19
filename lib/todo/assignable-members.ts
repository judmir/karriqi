/**
 * Shared helpers for assignee display names (metadata + email fallback).
 * Assignable people are loaded from `household_members` — see fetch-assignable-members.ts.
 */

const META_NAME_KEYS = [
  "display_name",
  "nickname",
  "full_name",
  "name",
  "preferred_username",
] as const;

export function displayNameFromUserMeta(
  meta: Record<string, unknown> | null | undefined,
): string | null {
  if (!meta) return null;
  for (const key of META_NAME_KEYS) {
    const v = meta[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

/** e.g. judikarriqi@gmail.com → "Judikarriqi"; john.doe@… → "John Doe" */
export function defaultDisplayNameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? email;
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length === 0) return email;
  return parts
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(" ");
}
