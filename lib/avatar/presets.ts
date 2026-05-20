/**
 * Profile background-colour presets. The avatar is always the user's initials;
 * the preset only picks the circle's background gradient.
 *
 * 3 warm tones (femaleish) + 3 cool tones (maleish) so a household with one
 * of each is easy to tell apart at a glance.
 *
 * The id is stored on `auth.users.user_metadata.avatar_preset`; `null` means
 * "no preset picked — use the deterministic hash colour".
 */

export const AVATAR_PRESET_IDS = [
  "peach",
  "blossom",
  "coral",
  "ocean",
  "teal",
  "indigo",
] as const;

export type AvatarPresetId = (typeof AVATAR_PRESET_IDS)[number];

export type AvatarPresetGroup = "warm" | "cool";

export type AvatarPreset = {
  id: AvatarPresetId;
  label: string;
  group: AvatarPresetGroup;
  /** Stops used to build the diagonal gradient. */
  from: string;
  to: string;
};

export const AVATAR_PRESETS: readonly AvatarPreset[] = [
  { id: "peach", label: "Peach", group: "warm", from: "#FFE0CC", to: "#FF8E72" },
  {
    id: "blossom",
    label: "Blossom",
    group: "warm",
    from: "#FFD6E7",
    to: "#E94B8F",
  },
  { id: "coral", label: "Coral", group: "warm", from: "#FFE3CF", to: "#F76A6A" },
  { id: "ocean", label: "Ocean", group: "cool", from: "#CFE4FF", to: "#3B7AD6" },
  { id: "teal", label: "Teal", group: "cool", from: "#C6F0EA", to: "#1F8C82" },
  {
    id: "indigo",
    label: "Indigo",
    group: "cool",
    from: "#D7D2FF",
    to: "#4B45B5",
  },
] as const;

const PRESET_BY_ID: Readonly<Record<AvatarPresetId, AvatarPreset>> =
  Object.fromEntries(AVATAR_PRESETS.map((p) => [p.id, p])) as Record<
    AvatarPresetId,
    AvatarPreset
  >;

/**
 * Maps the pre-shipped character ids (`f-1`..`m-4`) onto their closest colour
 * preset so anyone who picked one before this change keeps a sensible look.
 */
const LEGACY_ID_ALIASES: Readonly<Record<string, AvatarPresetId>> = {
  "f-1": "peach",
  "f-2": "blossom",
  "f-3": "coral",
  "f-4": "blossom",
  "m-1": "ocean",
  "m-2": "teal",
  "m-3": "indigo",
  "m-4": "indigo",
};

export function isAvatarPresetId(value: unknown): value is AvatarPresetId {
  return (
    typeof value === "string" &&
    (AVATAR_PRESET_IDS as readonly string[]).includes(value)
  );
}

export function getAvatarPreset(id: AvatarPresetId): AvatarPreset {
  return PRESET_BY_ID[id];
}

/** Inline style for a circle painted with the preset's diagonal gradient. */
export function avatarPresetStyle(id: AvatarPresetId): {
  background: string;
  color: string;
} {
  const p = PRESET_BY_ID[id];
  return {
    background: `linear-gradient(135deg, ${p.from}, ${p.to})`,
    color: "white",
  };
}

export function avatarPresetFromUserMeta(
  meta: Record<string, unknown> | null | undefined,
): AvatarPresetId | null {
  if (!meta) return null;
  const v = meta["avatar_preset"];
  if (typeof v !== "string") return null;
  if (isAvatarPresetId(v)) return v;
  return LEGACY_ID_ALIASES[v] ?? null;
}
