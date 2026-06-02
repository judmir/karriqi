/**
 * Optional comma-separated household account emails (server-only).
 * First email is the canonical owner for shared shopping data.
 * When unset, the app auto-links when exactly two Auth users exist.
 */
export function getHouseholdUserEmails(): string[] | null {
  const raw = process.env.HOUSEHOLD_USER_EMAILS?.trim();
  if (!raw) return null;

  const emails = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return emails.length >= 2 ? emails : null;
}
