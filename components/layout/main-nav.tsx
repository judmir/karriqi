"use client";

import { HouseHeart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { devNavItem, mainNavItems } from "@/config/navigation";
import { cn } from "@/lib/utils";

function NavLink({
  href,
  label,
  icon: Icon,
  compact,
}: {
  href: string;
  label: string;
  icon: (typeof mainNavItems)[number]["icon"];
  compact?: boolean;
}) {
  const pathname = usePathname();
  const active =
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      className={cn(
        "flex min-h-10 min-w-[3.25rem] items-center justify-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors",
        compact
          ? "flex-col gap-0.5 py-1.5 text-[0.65rem] leading-tight"
          : "py-2 md:justify-start",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
      )}
    >
      <Icon
        className={cn("size-5 shrink-0", compact && "size-[1.35rem]")}
        aria-hidden
      />
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
          <NavLink
            key={item.href}
            href={item.href}
            label={item.shortLabel}
            icon={item.icon}
            compact
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
        "bg-sidebar w-60 shrink-0 flex-col gap-0.5 px-3 py-4",
        open ? "hidden md:flex" : "hidden",
      )}
      aria-label="Main navigation"
      aria-hidden={!open}
    >
      <div className="text-foreground mb-3 flex items-center gap-2.5 px-3 pt-1.5 pb-3">
        <HouseHeart className="text-primary size-6" aria-hidden />
        <span className="text-base font-semibold tracking-tight">Karriqi</span>
      </div>
      <p className="text-muted-foreground px-3 pb-1.5 text-[0.7rem] font-medium tracking-[0.12em] uppercase">
        Family
      </p>
      {items.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
        />
      ))}
    </nav>
  );
}
