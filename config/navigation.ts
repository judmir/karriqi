import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  Code2,
  LayoutDashboard,
  ShoppingCart,
  SquareKanban,
  StickyNote,
} from "lucide-react";

import { ROUTES } from "@/config/routes";

export type MainNavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
};

/** Single source of truth for shell navigation (mobile + desktop). */
export const mainNavItems: MainNavItem[] = [
  {
    href: ROUTES.dashboard,
    label: "Dashboard",
    shortLabel: "Home",
    icon: LayoutDashboard,
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
];

export const devNavItem: MainNavItem = {
  href: ROUTES.dev,
  label: "Dev",
  shortLabel: "Dev",
  icon: Code2,
};

/** Routes with a page title but no sidebar item (e.g. user menu). */
const extraPageTitleRoutes: { href: string; label: string }[] = [
  { href: ROUTES.settings, label: "Settings" },
  { href: "/goals", label: "Goals" },
];

function matchesNavHref(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Resolve the main section title for the current pathname (longest prefix wins). */
export function resolvePageTitle(pathname: string): string | null {
  const navCandidates = [...mainNavItems, devNavItem].sort(
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
