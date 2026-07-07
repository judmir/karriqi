import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Building2,
  Calendar,
  CalendarDays,
  Code2,
  History,
  LayoutDashboard,
  List,
  ShoppingCart,
  SquareKanban,
  Stethoscope,
  Activity,
  StickyNote,
  Target,
} from "lucide-react";

import { ROUTES } from "@/config/routes";
import { REHAB_WIKI_NAV_ITEMS } from "@/modules/rehab/neuro-rehab-2026/wiki-nav";

export type MainNavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
};

/** Rehab section (sidebar, above Family). */
export const rehabNavItems: MainNavItem[] = [
  {
    href: ROUTES.rehabToday,
    label: "Today",
    shortLabel: "Today",
    icon: Calendar,
  },
  {
    href: ROUTES.rehabPlan,
    label: "Upcoming",
    shortLabel: "Upcoming",
    icon: List,
  },
  {
    href: ROUTES.rehabHistory,
    label: "History",
    shortLabel: "History",
    icon: History,
  },
  {
    href: ROUTES.rehabClinical,
    label: "Clinical",
    shortLabel: "Clinical",
    icon: Stethoscope,
  },
  {
    href: ROUTES.rehabWiki,
    label: "Wiki",
    shortLabel: "Wiki",
    icon: BookOpen,
  },
];

/** Single source of truth for shell navigation (mobile + desktop). */
export const mainNavItems: MainNavItem[] = [
  {
    href: ROUTES.dashboard,
    label: "Dashboard",
    shortLabel: "Home",
    icon: LayoutDashboard,
  },
  {
    href: ROUTES.ruleOfThree,
    label: "Rule of 3",
    shortLabel: "Rule 3",
    icon: Target,
  },
  {
    href: ROUTES.shopping,
    label: "Shopping",
    shortLabel: "Shop",
    icon: ShoppingCart,
  },
  {
    href: ROUTES.todo,
    label: "Kanban",
    shortLabel: "Kanban",
    icon: SquareKanban,
  },
  {
    href: ROUTES.calendar,
    label: "Calendar",
    shortLabel: "Cal",
    icon: CalendarDays,
  },
  {
    href: ROUTES.notes,
    label: "Notes",
    shortLabel: "Notes",
    icon: StickyNote,
  },
  {
    href: ROUTES.pulse,
    label: "Pulse",
    shortLabel: "Pulse",
    icon: Activity,
  },
  {
    href: ROUTES.apartment,
    label: "Apartment",
    shortLabel: "Apt",
    icon: Building2,
  },
];

export const devNavItem: MainNavItem = {
  href: ROUTES.dev,
  label: "Dev",
  shortLabel: "Dev",
  icon: Code2,
};

const wikiTitleBySlug: Record<string, string> = Object.fromEntries(
  REHAB_WIKI_NAV_ITEMS.map((p) => [p.slug, p.title]),
);
wikiTitleBySlug.overview = "Wiki";

/** Routes with a page title but no sidebar item (e.g. user menu). */
const extraPageTitleRoutes: { href: string; label: string }[] = [
  { href: ROUTES.settings, label: "Settings" },
  { href: "/goals", label: "Goals" },
];

function matchesNavHref(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isRehabRoute(pathname: string): boolean {
  return pathname === "/rehab" || pathname.startsWith("/rehab/");
}

export type MobileNavSection = "rehab" | "family";

export function mobileNavSectionFromPathname(pathname: string): MobileNavSection {
  return isRehabRoute(pathname) ? "rehab" : "family";
}

function resolveWikiTitle(pathname: string): string | null {
  if (pathname === ROUTES.rehabWikiOverview) {
    return "Wiki";
  }
  const prefix = `${ROUTES.rehabWiki}/`;
  if (pathname.startsWith(prefix)) {
    const slug = pathname.slice(prefix.length).split("/")[0];
    return wikiTitleBySlug[slug] ?? "Wiki";
  }
  return null;
}

/** Resolve the main section title for the current pathname (longest prefix wins). */
export function resolvePageTitle(pathname: string): string | null {
  const wikiTitle = resolveWikiTitle(pathname);
  if (wikiTitle) {
    return wikiTitle;
  }

  const navCandidates = [...rehabNavItems, ...mainNavItems, devNavItem].sort(
    (a, b) => b.href.length - a.href.length,
  );

  for (const item of navCandidates) {
    if (matchesNavHref(pathname, item.href)) {
      return item.label;
    }
  }

  const extraCandidates = [...extraPageTitleRoutes].sort(
    (a, b) => b.href.length - a.href.length,
  );

  for (const route of extraCandidates) {
    if (matchesNavHref(pathname, route.href)) {
      return route.label;
    }
  }

  return null;
}
