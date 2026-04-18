import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  LayoutDashboard,
  ListTodo,
  Settings,
  ShoppingCart,
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
    label: "To-do",
    shortLabel: "Tasks",
    icon: ListTodo,
  },
  {
    href: ROUTES.calendar,
    label: "Calendar",
    shortLabel: "Cal",
    icon: CalendarDays,
  },
  {
    href: ROUTES.settings,
    label: "Settings",
    shortLabel: "More",
    icon: Settings,
  },
];
