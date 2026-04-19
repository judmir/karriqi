"use client";

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
        "flex min-h-11 min-w-[3.25rem] items-center justify-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
        compact
          ? "flex-col gap-0.5 py-1.5 text-[0.65rem] leading-tight"
          : "py-2.5 md:justify-start",
        active
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
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

export function MainNavDesktop({ includeDevNav }: { includeDevNav?: boolean }) {
  const items = navItemsFor(includeDevNav ?? false);
  return (
    <nav
      className="border-border bg-sidebar hidden w-56 shrink-0 flex-col gap-1 border-r p-3 md:flex"
      aria-label="Main navigation"
    >
      <p className="text-muted-foreground px-3 pb-2 text-xs font-medium tracking-wider uppercase">
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
