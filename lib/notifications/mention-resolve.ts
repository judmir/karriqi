export const MENTION_TOKEN_RE = /@([^\s@]+)/g;

/**
 * Returns user ids for @mentions in `body` matching assignable members by
 * display name (case-insensitive). Duplicates removed; `authorUserId` excluded.
 */
export function resolveMentionedUserIds(
  body: string,
  members: { userId: string; displayName: string }[],
  authorUserId: string,
): string[] {
  const tokens = new Set<string>();
  let m: RegExpExecArray | null;
  const re = new RegExp(MENTION_TOKEN_RE.source, "g");
  while ((m = re.exec(body)) !== null) {
    const raw = m[1]?.trim();
    if (raw) tokens.add(raw);
  }

  if (tokens.size === 0) return [];

  const byName = new Map(
    members.map((mem) => [
      mem.displayName.trim().toLowerCase(),
      mem.userId,
    ]),
  );

  const out = new Set<string>();
  for (const t of tokens) {
    const hit = byName.get(t.toLowerCase());
    if (hit && hit !== authorUserId) out.add(hit);
  }

  return [...out];
}
