export const ROUTES = {
  home: "/",
  rehabClinical: "/rehab/clinical",
  rehabStoicPath: "/rehab/stoic-path",
  rehabPlanList: "/rehab/plan-list",
  rehabToday: "/rehab/today",
  rehabPlan: "/rehab/plan",
  rehabHistory: "/rehab/history",
  rehabWiki: "/rehab/wiki",
  rehabWikiOverview: "/rehab/wiki",
  dashboard: "/dashboard",
  ruleOfThree: "/rule-of-3",
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


export type RehabEventReturnTo = "today" | "history" | "plan";

/** Rehab task view/edit (full page on mobile). */
export function rehabEventPath(id: string, returnTo?: RehabEventReturnTo): string {
  const qs = returnTo ? `?from=${returnTo}` : "";
  return `/rehab/events/${encodeURIComponent(id)}${qs}`;
}

export function rehabEventReturnHref(
  from: RehabEventReturnTo | null | undefined,
): string {
  switch (from) {
    case "history":
      return ROUTES.rehabHistory;
    case "plan":
      return ROUTES.rehabPlan;
    case "today":
    default:
      return ROUTES.rehabToday;
  }
}

/** Single task view/edit (e.g. Jira-style page). */
export function todoTaskPath(id: string) {
  return `/kanban/${id}`;
}

/** URL prefixes that require an authenticated session (middleware). */
export const PROTECTED_ROUTE_PREFIXES: string[] = [
  "/rehab",
  ROUTES.dashboard,
  ROUTES.ruleOfThree,
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
