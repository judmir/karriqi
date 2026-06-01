export const ROUTES = {
  home: "/",
  rehabClinical: "/rehab/clinical",
  rehabPlanList: "/rehab/plan-list",
  rehabToday: "/rehab/today",
  rehabPlan: "/rehab/plan",
  rehabWiki: "/rehab/wiki",
  rehabWikiOverview: "/rehab/wiki",
  dashboard: "/dashboard",
  shopping: "/shopping",
  shoppingAdmin: "/shopping/admin",
  todo: "/kanban",
  calendar: "/calendar",
  notes: "/notes",
  settings: "/settings",
  dev: "/dev",
  devPush: "/dev/push",
  devArchitecture: "/dev/architecture",
  signIn: "/auth/sign-in",
  authCallback: "/auth/callback",
} as const;

/** Single task view/edit (e.g. Jira-style page). */
export function todoTaskPath(id: string) {
  return `/kanban/${id}`;
}

/** URL prefixes that require an authenticated session (middleware). */
export const PROTECTED_ROUTE_PREFIXES: string[] = [
  "/rehab",
  ROUTES.dashboard,
  ROUTES.shopping,
  ROUTES.todo,
  ROUTES.calendar,
  ROUTES.notes,
  ROUTES.settings,
  ROUTES.dev,
];

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function rehabWikiPath(slug: string): string {
  return slug === "overview" ? ROUTES.rehabWikiOverview : `${ROUTES.rehabWiki}/${slug}`;
}

export function isCalendarRoute(pathname: string): boolean {
  return (
    pathname === ROUTES.calendar ||
    pathname.startsWith(`${ROUTES.calendar}/`) ||
    pathname === ROUTES.rehabPlan ||
    pathname.startsWith(`${ROUTES.rehabPlan}/`)
  );
}
