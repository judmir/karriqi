/**
 * Per-user accent colors used to highlight who added a shopping list item.
 *
 * Each entry exposes:
 *  - `id`   — short slug stored in `auth.users.user_metadata.profile_color`
 *             and snapshotted onto `shopping_list_items.created_by_color`.
 *  - `name` — human label for the color picker.
 *  - `swatch` — solid hex used inside the picker tile so users see the
 *               color even before the row tint is rendered.
 *  - `accent` — translucent rgba applied as the left-border / row tint
 *               in the shopping list. Tuned to read well on the dark theme
 *               the app currently forces; alpha keeps it subtle.
 */
export type ProfileColor = {
  id: string;
  name: string;
  swatch: string;
  accent: string;
};

export const PROFILE_COLORS = [
  {
    id: "rose",
    name: "Rose",
    swatch: "#fb7185",
    accent: "rgba(251, 113, 133, 0.6)",
  },
  {
    id: "amber",
    name: "Amber",
    swatch: "#fbbf24",
    accent: "rgba(251, 191, 36, 0.6)",
  },
  {
    id: "emerald",
    name: "Emerald",
    swatch: "#34d399",
    accent: "rgba(52, 211, 153, 0.6)",
  },
  {
    id: "sky",
    name: "Sky",
    swatch: "#38bdf8",
    accent: "rgba(56, 189, 248, 0.6)",
  },
  {
    id: "violet",
    name: "Violet",
    swatch: "#a78bfa",
    accent: "rgba(167, 139, 250, 0.6)",
  },
  {
    id: "pink",
    name: "Pink",
    swatch: "#f472b6",
    accent: "rgba(244, 114, 182, 0.6)",
  },
  {
    id: "lime",
    name: "Lime",
    swatch: "#a3e635",
    accent: "rgba(163, 230, 53, 0.6)",
  },
  {
    id: "slate",
    name: "Slate",
    swatch: "#94a3b8",
    accent: "rgba(148, 163, 184, 0.6)",
  },
] as const satisfies readonly ProfileColor[];

export type ProfileColorId = (typeof PROFILE_COLORS)[number]["id"];

const PROFILE_COLOR_BY_ID = new Map<string, ProfileColor>(
  PROFILE_COLORS.map((c) => [c.id, c]),
);

export function isProfileColorId(value: unknown): value is ProfileColorId {
  return typeof value === "string" && PROFILE_COLOR_BY_ID.has(value);
}

export function getProfileColor(id: string | null | undefined): ProfileColor | null {
  if (!id) return null;
  return PROFILE_COLOR_BY_ID.get(id) ?? null;
}

const META_COLOR_KEY = "profile_color";

/** Extracts a valid profile color slug from a user metadata blob, or null. */
export function profileColorFromUserMeta(
  meta: Record<string, unknown> | null | undefined,
): ProfileColorId | null {
  if (!meta) return null;
  const raw = meta[META_COLOR_KEY];
  return isProfileColorId(raw) ? raw : null;
}

export const PROFILE_COLOR_META_KEY = META_COLOR_KEY;
