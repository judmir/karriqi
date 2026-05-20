/**
 * Helpers for the initials-only avatar fallback (used when a user has no
 * preset picked, or when a preset SVG fails to load).
 *
 * The hue is derived deterministically from a stable seed (user id, display
 * name, or email) so the same person always gets the same colour across the
 * app — the visual differentiator between household members.
 */

export function initialsFromName(input: string | null | undefined): string {
  const s = (input ?? "").trim();
  if (!s) return "?";
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0]?.[0] ?? "";
    const b = parts[1]?.[0] ?? "";
    const out = (a + b).toUpperCase();
    return out || "?";
  }
  const p = parts[0] ?? s;
  if (p.length >= 2) return p.slice(0, 2).toUpperCase();
  return p.toUpperCase() || "?";
}

export function hueFromSeed(seed: string | null | undefined): number {
  const s = seed ?? "";
  let h = 5381;
  for (let i = 0; i < s.length; i += 1) {
    h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}

/** Inline style for a saturated-but-readable solid background per seed. */
export function fallbackStyleForSeed(seed: string | null | undefined): {
  backgroundColor: string;
  color: string;
} {
  const hue = hueFromSeed(seed);
  return {
    backgroundColor: `hsl(${hue} 55% 42%)`,
    color: "white",
  };
}
