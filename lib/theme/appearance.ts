export const APPEARANCE_PRESETS = ["default"] as const;
export const APPEARANCE_SCALES = ["default", "xs", "lg"] as const;
export const APPEARANCE_RADII = ["default", "sm", "md", "lg", "xl"] as const;
export const APPEARANCE_COLOR_MODES = ["light", "dark"] as const;
export const APPEARANCE_CONTENT_LAYOUTS = ["full", "centered"] as const;
export const APPEARANCE_SIDEBAR_MODES = ["default", "icon"] as const;
export const APPEARANCE_USER_META_KEY = "theme_appearance";

export type AppearancePreset = (typeof APPEARANCE_PRESETS)[number];
export type AppearanceScale = (typeof APPEARANCE_SCALES)[number];
export type AppearanceRadius = (typeof APPEARANCE_RADII)[number];
export type AppearanceColorMode = (typeof APPEARANCE_COLOR_MODES)[number];
export type AppearanceContentLayout =
  (typeof APPEARANCE_CONTENT_LAYOUTS)[number];
export type AppearanceSidebarMode = (typeof APPEARANCE_SIDEBAR_MODES)[number];

export type AppearanceState = {
  preset: AppearancePreset;
  scale: AppearanceScale;
  radius: AppearanceRadius;
  colorMode: AppearanceColorMode;
  contentLayout: AppearanceContentLayout;
  sidebarMode: AppearanceSidebarMode;
};

export const DEFAULT_APPEARANCE: AppearanceState = {
  preset: "default",
  scale: "default",
  radius: "default",
  colorMode: "dark",
  contentLayout: "full",
  sidebarMode: "default",
};

export const APPEARANCE_RADIUS_VALUES: Record<AppearanceRadius, string> = {
  default: "0rem",
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.25rem",
};

function pickAppearanceValue<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return typeof value === "string" && allowed.includes(value as T)
    ? (value as T)
    : fallback;
}

export function sanitizeAppearanceState(
  value: Partial<AppearanceState> | null | undefined,
): AppearanceState {
  return {
    preset: pickAppearanceValue(
      value?.preset,
      APPEARANCE_PRESETS,
      DEFAULT_APPEARANCE.preset,
    ),
    scale: pickAppearanceValue(
      value?.scale,
      APPEARANCE_SCALES,
      DEFAULT_APPEARANCE.scale,
    ),
    radius: pickAppearanceValue(
      value?.radius,
      APPEARANCE_RADII,
      DEFAULT_APPEARANCE.radius,
    ),
    colorMode: DEFAULT_APPEARANCE.colorMode,
    contentLayout: DEFAULT_APPEARANCE.contentLayout,
    sidebarMode: DEFAULT_APPEARANCE.sidebarMode,
  };
}

export function appearanceFromUserMeta(
  meta: Record<string, unknown> | null | undefined,
): AppearanceState {
  const rawValue = meta?.[APPEARANCE_USER_META_KEY];
  if (!rawValue || typeof rawValue !== "object") {
    return DEFAULT_APPEARANCE;
  }

  return sanitizeAppearanceState(rawValue as Partial<AppearanceState>);
}
