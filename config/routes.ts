export const ROUTES = {
  home: "/",
  dashboard: "/dashboard",
  apartments: "/apartments",
  shopping: "/shopping",
  shoppingAdmin: "/shopping/admin",
  todo: "/todo",
  calendar: "/calendar",
  settings: "/settings",
  dev: "/dev",
  devPush: "/dev/push",
  devArchitecture: "/dev/architecture",
  signIn: "/auth/sign-in",
  authCallback: "/auth/callback",
} as const;

/** Single task view/edit (e.g. Jira-style page). */
export function todoTaskPath(id: string) {
  return `/todo/${id}`;
}

export function apartmentsPath(id: string) {
  return `/apartments/${id}`;
}

/** URL prefixes that require an authenticated session (middleware). */
export const PROTECTED_ROUTE_PREFIXES: string[] = [
  ROUTES.dashboard,
  ROUTES.apartments,
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
