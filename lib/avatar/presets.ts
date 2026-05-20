/**
 * Preset profile-picture characters that live as SVG files in `public/avatars/`.
 *
 * The id stored in `user_metadata.avatar_preset` is one of `AVATAR_PRESET_IDS`,
 * or `null` (initials-only fallback). Female presets are warm-toned and male
 * presets are cool-toned so a household with one of each is immediately
 * distinguishable in a small circle.
 */

export const AVATAR_PRESET_IDS = [
  "f-1",
  "f-2",
  "f-3",
  "f-4",
  "m-1",
  "m-2",
  "m-3",
  "m-4",
] as const;

export type AvatarPresetId = (typeof AVATAR_PRESET_IDS)[number];

export type AvatarPreset = {
  id: AvatarPresetId;
  label: string;
  group: "female" | "male";
};

export const AVATAR_PRESETS: readonly AvatarPreset[] = [
  { id: "f-1", label: "Peach", group: "female" },
  { id: "f-2", label: "Blossom", group: "female" },
  { id: "f-3", label: "Coral", group: "female" },
  { id: "f-4", label: "Plum", group: "female" },
  { id: "m-1", label: "Ocean", group: "male" },
  { id: "m-2", label: "Teal", group: "male" },
  { id: "m-3", label: "Indigo", group: "male" },
  { id: "m-4", label: "Slate", group: "male" },
] as const;

export function isAvatarPresetId(value: unknown): value is AvatarPresetId {
  return (
    typeof value === "string" &&
    (AVATAR_PRESET_IDS as readonly string[]).includes(value)
  );
}

export function avatarPresetSrc(id: AvatarPresetId): string {
  return `/avatars/${id}.svg`;
}

export function avatarPresetFromUserMeta(
  meta: Record<string, unknown> | null | undefined,
): AvatarPresetId | null {
  if (!meta) return null;
  const v = meta["avatar_preset"];
  if (typeof v === "string" && isAvatarPresetId(v)) return v;
  return null;
}
