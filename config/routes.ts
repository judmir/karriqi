export const ROUTES = {
  home: "/",
  dashboard: "/dashboard",
  shopping: "/shopping",
  shoppingAdmin: "/shopping/admin",
  todo: "/todo",
  calendar: "/calendar",
  settings: "/settings",
  dev: "/dev",
  signIn: "/auth/sign-in",
  authCallback: "/auth/callback",
} as const;

/** Single task view/edit (e.g. Jira-style page). */
export function todoTaskPath(id: string) {
  return `/todo/${id}`;
}

/** URL prefixes that require an authenticated session (middleware). */
export const PROTECTED_ROUTE_PREFIXES: string[] = [
  ROUTES.dashboard,
  ROUTES.shopping,
  ROUTES.todo,
  ROUTES.calendar,
  ROUTES.settings,
  ROUTES.dev,
];

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
