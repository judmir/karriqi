"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { KarriqiLogoMark } from "@/components/brand/karriqi-logo";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  devNavItem,
  mainNavItems,
  mobileNavSectionFromPathname,
  rehabNavItems,
  type MainNavItem,
  type MobileNavSection,
} from "@/config/navigation";
import { cn } from "@/lib/utils";

type NavIcon = MainNavItem["icon"];

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
      prefetch={false}
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
      prefetch={false}
      className={cn(
        "flex h-full min-h-0 min-w-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1 text-[0.65rem] font-medium leading-tight transition-colors",
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

function DesktopNavSection({
  title,
  items,
  open,
}: {
  title: string;
  items: MainNavItem[];
  open: boolean;
}) {
  return (
    <div className="relative flex w-64 min-w-0 flex-col p-2">
      <p
        className={cn(
          "text-sidebar-foreground/70 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0",
        )}
      >
        {title}
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

function MobileNavRow({ items }: { items: MainNavItem[] }) {
  return (
    <div className="mx-auto flex h-[3.25rem] w-full max-w-3xl shrink-0 items-stretch justify-between gap-0.5 px-2">
      {items.map((item) => (
        <MobileNavLink
          key={item.href}
          href={item.href}
          label={item.shortLabel}
          icon={item.icon}
        />
      ))}
    </div>
  );
}

const MOBILE_NAV_ROW_HEIGHT = "3.25rem";

const MOBILE_NAV_SWIPE_THRESHOLD_PX = 28;
const MOBILE_NAV_SWIPE_INTENT_PX = 8;

export function MainNavMobile({ includeDevNav }: { includeDevNav?: boolean }) {
  const pathname = usePathname();
  const familyItems = navItemsFor(includeDevNav ?? false);
  const [section, setSection] = useState<MobileNavSection>(() =>
    mobileNavSectionFromPathname(pathname),
  );
  const dragRef = useRef<{
    startX: number;
    startY: number;
    swiping: boolean;
  } | null>(null);

  useEffect(() => {
    setSection(mobileNavSectionFromPathname(pathname));
  }, [pathname]);

  const sectionLabel = section === "rehab" ? "Rehab" : "Family";
  const otherSectionLabel = section === "rehab" ? "Family" : "Rehab";

  function onPointerDown(e: React.PointerEvent<HTMLElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      swiping: false,
    };
  }

  function onPointerMove(e: React.PointerEvent<HTMLElement>) {
    if (!dragRef.current) return;

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    if (!dragRef.current.swiping) {
      const absY = Math.abs(dy);
      const absX = Math.abs(dx);
      if (absY <= MOBILE_NAV_SWIPE_INTENT_PX || absY <= absX) return;

      dragRef.current.swiping = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    if (dragRef.current.swiping) {
      e.preventDefault();
    }
  }

  function onPointerUp(e: React.PointerEvent<HTMLElement>) {
    if (!dragRef.current) return;

    const dy = e.clientY - dragRef.current.startY;
    const shouldToggle =
      dragRef.current.swiping &&
      Math.abs(dy) >= MOBILE_NAV_SWIPE_THRESHOLD_PX;

    if (shouldToggle) {
      setSection((current) => (current === "rehab" ? "family" : "rehab"));
    }

    if (dragRef.current.swiping) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    dragRef.current = null;
  }

  function onPointerCancel(e: React.PointerEvent<HTMLElement>) {
    if (dragRef.current?.swiping) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragRef.current = null;
  }

  return (
    <nav
      className="border-border bg-background/90 supports-[backdrop-filter]:bg-background/75 fixed right-0 bottom-0 left-0 z-40 touch-pan-x border-t backdrop-blur-md md:hidden"
      aria-label={`Main navigation, ${sectionLabel} section. Swipe up or down to switch to ${otherSectionLabel}.`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <div
        className="flex flex-col"
        style={{
          paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="text-muted-foreground flex items-center justify-center gap-1.5 px-2 pt-1.5 select-none">
          <span
            className={cn(
              "size-1 rounded-full transition-colors",
              section === "rehab" ? "bg-foreground/70" : "bg-foreground/25",
            )}
            aria-hidden
          />
          <p className="text-[0.6rem] font-medium tracking-wide uppercase">
            {sectionLabel}
          </p>
          <span
            className={cn(
              "size-1 rounded-full transition-colors",
              section === "family" ? "bg-foreground/70" : "bg-foreground/25",
            )}
            aria-hidden
          />
        </div>

        <div
          className="bg-background overflow-hidden"
          style={{ height: MOBILE_NAV_ROW_HEIGHT }}
        >
          <div
            className="bg-background transition-transform duration-300 ease-out"
            style={{
              transform:
                section === "rehab"
                  ? "translateY(0)"
                  : `translateY(calc(-1 * ${MOBILE_NAV_ROW_HEIGHT}))`,
            }}
          >
            <MobileNavRow items={rehabNavItems} />
            <MobileNavRow items={familyItems} />
          </div>
        </div>
      </div>
    </nav>
  );
}

export function MainNavDesktop({
  includeDevNav,
  open = true,
  onToggleSidebar,
}: {
  includeDevNav?: boolean;
  open?: boolean;
  onToggleSidebar?: () => void;
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

      <DesktopNavSection title="Rehab" items={rehabNavItems} open={open} />
      <DesktopNavSection title="Family" items={items} open={open} />
    </nav>
  );
}
