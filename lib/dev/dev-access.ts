/** Only this account may see Dev tools (gated by email + profile toggle). */
export const DEV_MENU_EMAIL = "jusikarriqi@gmail.com";

export function isDevMenuEmail(
  email: string | null | undefined,
): boolean {
  return (email ?? "").trim().toLowerCase() === DEV_MENU_EMAIL;
}

export function isDevMenuEnabledInMetadata(
  meta: Record<string, unknown> | null | undefined,
): boolean {
  return meta?.dev_menu_enabled === true;
}

export function canUseDevMenu(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
} | null): boolean {
  if (!user) return false;
  return (
    isDevMenuEmail(user.email) &&
    isDevMenuEnabledInMetadata(user.user_metadata ?? undefined)
  );
}
