import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  Code2,
  LayoutDashboard,
  ShoppingCart,
  SquareKanban,
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
];

export const devNavItem: MainNavItem = {
  href: ROUTES.dev,
  label: "Dev",
  shortLabel: "Dev",
  icon: Code2,
};
