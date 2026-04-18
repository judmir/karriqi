export const ROUTES = {
  home: "/",
  dashboard: "/dashboard",
  shopping: "/shopping",
  todo: "/todo",
  calendar: "/calendar",
  settings: "/settings",
  signIn: "/auth/sign-in",
  authCallback: "/auth/callback",
} as const;

/** URL prefixes that require an authenticated session (middleware). */
export const PROTECTED_ROUTE_PREFIXES: string[] = [
  ROUTES.dashboard,
  ROUTES.shopping,
  ROUTES.todo,
  ROUTES.calendar,
  ROUTES.settings,
];

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
