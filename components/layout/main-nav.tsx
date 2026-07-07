"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";

import { KarriqiLogoMark } from "@/components/brand/karriqi-logo";
import { MobileSubitemNavbar } from "@/components/layout/mobile-subitem-navbar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  buildMobileNavTabs,
  devNavItem,
  mainNavItems,
  rehabNavItems,
  type MainNavItem,
} from "@/config/navigation";
import { cn } from "@/lib/utils";

type NavIcon = MainNavItem["icon"];

function useIsActive(href: string) {
  const pathname = usePathname();
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

function navItemsFor(includeDev: boolean) {
  return includeDev ? [...mainNavItems, devNavItem] : mainNavItems;
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

function DesktopNavSection({
  title,
  items,
  open,
}: {
  title?: string;
  items: MainNavItem[];
  open: boolean;
}) {
  return (
    <div className="relative flex w-64 min-w-0 flex-col p-2">
      {title ? (
        <p
          className={cn(
            "text-sidebar-foreground/70 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium transition-opacity duration-200",
            open ? "opacity-100" : "opacity-0",
          )}
        >
          {title}
        </p>
      ) : null}
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
  );
}

const sidebarToggleButtonClass =
  "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md bg-transparent transition-colors focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2";

function SidebarBrandHeader({
  open,
  onToggleSidebar,
}: {
  open: boolean;
  onToggleSidebar: () => void;
}) {
  if (open) {
    return (
      <div className="text-foreground flex h-10 w-full items-center gap-2 rounded-md px-2">
        <KarriqiLogoMark className="size-8 shrink-0" />
        <span className="text-base font-semibold tracking-tight">Karriqi</span>
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                className={cn(sidebarToggleButtonClass, "ml-auto")}
                aria-label="Close sidebar"
                aria-expanded
                onClick={onToggleSidebar}
              >
                <PanelLeftClose className="size-4" aria-hidden />
              </button>
            }
          />
          <TooltipContent side="bottom" sideOffset={6}>
            Close sidebar
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="flex h-10 items-center justify-center px-2">
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              className={cn(sidebarToggleButtonClass, "group/logo-toggle")}
              aria-label="Open sidebar"
              aria-expanded={false}
              onClick={onToggleSidebar}
            >
              <KarriqiLogoMark className="size-8 group-hover/logo-toggle:hidden" />
              <PanelLeftOpen
                className="hidden size-4 group-hover/logo-toggle:block"
                aria-hidden
              />
            </button>
          }
        />
        <TooltipContent side="right" sideOffset={6}>
          Open sidebar
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export function MainNavMobile({
  includeDevNav,
  includeRehabNav,
}: {
  includeDevNav?: boolean;
  includeRehabNav?: boolean;
}) {
  const tabs = buildMobileNavTabs({
    includeDevNav: includeDevNav ?? false,
    includeRehabNav: includeRehabNav ?? false,
  });

  return (
    <nav
      className="pointer-events-none fixed inset-0 z-40 md:hidden"
      aria-label="Main navigation"
    >
      <MobileSubitemNavbar tabs={tabs} />
    </nav>
  );
}

export function MainNavDesktop({
  includeDevNav,
  includeRehabNav,
  open = true,
  onToggleSidebar,
}: {
  includeDevNav?: boolean;
  includeRehabNav?: boolean;
  open?: boolean;
  onToggleSidebar?: () => void;
}) {
  const items = navItemsFor(includeDevNav ?? false);
  const showRehabNav = includeRehabNav ?? false;
  return (
    <nav
      className={cn(
        "bg-sidebar hidden shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out md:flex md:flex-col",
        open ? "w-64" : "w-14",
      )}
      aria-label="Main navigation"
      data-state={open ? "expanded" : "collapsed"}
    >
      <div
        className={cn(
          "flex flex-col gap-2 p-2",
          open ? "w-64" : "w-14",
        )}
      >
        {onToggleSidebar ? (
          <SidebarBrandHeader open={open} onToggleSidebar={onToggleSidebar} />
        ) : (
          <div className="text-foreground flex h-10 items-center gap-2 rounded-md px-2">
            <KarriqiLogoMark className="size-8 shrink-0" />
            <span
              className={cn(
                "text-base font-semibold tracking-tight transition-opacity duration-200",
                open ? "opacity-100" : "opacity-0",
              )}
            >
              Karriqi
            </span>
          </div>
        )}
      </div>

      {showRehabNav ? (
        <>
          <DesktopNavSection title="Rehab" items={rehabNavItems} open={open} />
          <DesktopNavSection title="Family" items={items} open={open} />
        </>
      ) : (
        <DesktopNavSection items={items} open={open} />
      )}
    </nav>
  );
}
