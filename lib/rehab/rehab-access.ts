/** Only this account may use rehab routes and navigation. */
export const REHAB_ACCESS_EMAIL = "judikarriqi@gmail.com";

export function isRehabAccessEmail(email: string | null | undefined): boolean {
  return (email ?? "").trim().toLowerCase() === REHAB_ACCESS_EMAIL;
}

export function isRehabPath(pathname: string): boolean {
  return pathname === "/rehab" || pathname.startsWith("/rehab/");
}

export function canUseRehab(
  user: { email?: string | null } | null,
): boolean {
  if (!user) return false;
  return isRehabAccessEmail(user.email);
}
