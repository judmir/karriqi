"use client";

import { HouseHeart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { devNavItem, mainNavItems } from "@/config/navigation";
import { cn } from "@/lib/utils";

type NavIcon = (typeof mainNavItems)[number]["icon"];

function useIsActive(href: string) {
  const pathname = usePathname();
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

function DesktopNavLink({
  href,
  label,
  icon: Icon,
  collapsed = false,
}: {
  href: string;
  label: string;
  icon: NavIcon;
  collapsed?: boolean;
}) {
  const active = useIsActive(href);
  const iconRef = useRef<HTMLSpanElement>(null);

  const link = (
    <Link
      href={href}
      aria-label={collapsed ? label : undefined}
      className={cn(
        "group/nav flex h-8 w-full cursor-pointer items-center gap-2 overflow-hidden rounded-md px-2 text-left text-sm transition-colors",
        "focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2",
        !collapsed &&
          (active
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
            : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"),
        collapsed &&
          (active ? "text-sidebar-accent-foreground" : "text-muted-foreground"),
      )}
    >
      <span
        ref={iconRef}
        className={cn(
          "inline-flex size-8 shrink-0 items-center justify-center rounded-md transition-colors",
          collapsed &&
            active &&
            "bg-sidebar-accent text-sidebar-accent-foreground",
          collapsed &&
            !active &&
            "group-hover/nav:bg-primary/10 group-hover/nav:text-foreground",
        )}
      >
        <Icon className="size-4 shrink-0" aria-hidden />
      </span>
      <span
        className={cn(
          "truncate transition-opacity duration-200",
          collapsed ? "opacity-0" : "opacity-100",
        )}
      >
        {label}
      </span>
    </Link>
  );

  if (!collapsed) {
    return link;
  }

  return (
    <Tooltip>
      <TooltipTrigger render={link} />
      <TooltipContent side="right" sideOffset={6} anchor={iconRef}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function MobileNavLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: NavIcon;
}) {
  const active = useIsActive(href);

  return (
    <Link
      href={href}
      className={cn(
        "flex min-h-10 min-w-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1.5 text-[0.65rem] font-medium leading-tight transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
      )}
    >
      <Icon className="size-[1.35rem] shrink-0" aria-hidden />
      <span>{label}</span>
    </Link>
  );
}

function navItemsFor(includeDev: boolean) {
  return includeDev ? [...mainNavItems, devNavItem] : mainNavItems;
}

export function MainNavMobile({ includeDevNav }: { includeDevNav?: boolean }) {
  const items = navItemsFor(includeDevNav ?? false);
  return (
    <nav
      className="border-border bg-background/90 supports-[backdrop-filter]:bg-background/75 fixed right-0 bottom-0 left-0 z-40 border-t backdrop-blur-md md:hidden"
      aria-label="Main navigation"
    >
      <div
        className="mx-auto flex max-w-3xl items-stretch justify-between gap-0.5 px-2 pt-1"
        style={{
          paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
        }}
      >
        {items.map((item) => (
          <MobileNavLink
            key={item.href}
            href={item.href}
            label={item.shortLabel}
            icon={item.icon}
          />
        ))}
      </div>
    </nav>
  );
}

export function MainNavDesktop({
  includeDevNav,
  open = true,
}: {
  includeDevNav?: boolean;
  open?: boolean;
}) {
  const items = navItemsFor(includeDevNav ?? false);
  return (
    <nav
      className={cn(
        "bg-sidebar hidden shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out md:flex md:flex-col",
        open ? "w-64" : "w-14",
      )}
      aria-label="Main navigation"
      data-state={open ? "expanded" : "collapsed"}
    >
      <div className="flex w-64 flex-col gap-2 p-2">
        <div className="text-foreground flex h-10 items-center gap-2 rounded-md p-2">
          <span
            className="inline-flex shrink-0 items-center justify-center rounded-[5px] bg-[#020202] p-1.5"
            aria-hidden
          >
            <HouseHeart className="text-primary size-5 shrink-0" aria-hidden />
          </span>
          <span
            className={cn(
              "text-base font-semibold tracking-tight transition-opacity duration-200",
              open ? "opacity-100" : "opacity-0",
            )}
          >
            Karriqi
          </span>
        </div>
      </div>

      <div className="relative flex w-64 min-w-0 flex-col p-2">
        <p
          className={cn(
            "text-sidebar-foreground/70 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium transition-opacity duration-200",
            open ? "opacity-100" : "opacity-0",
          )}
        >
          Family
        </p>
        <ul className="flex min-w-0 flex-col gap-1">
          {items.map((item) => (
            <li key={item.href} className="relative">
              <DesktopNavLink
                href={item.href}
                label={item.label}
                icon={item.icon}
                collapsed={!open}
              />
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
