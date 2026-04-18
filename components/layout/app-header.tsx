"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { UserMenu } from "@/components/layout/user-menu";
import { mainNavItems } from "@/config/navigation";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";

export function AppHeader({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const current = mainNavItems.find(
    (item) =>
      pathname === item.href ||
      (item.href !== "/" && pathname.startsWith(`${item.href}/`)),
  );
  const title = current?.label ?? "Karriqi";

  return (
    <header
      className={cn(
        "border-border bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 border-b backdrop-blur-md",
      )}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex min-h-14 items-center justify-between gap-3 px-4 py-2 md:px-6">
        <div className="min-w-0">
          <Link
            href={ROUTES.dashboard}
            className="text-muted-foreground hover:text-foreground text-xs font-medium tracking-wide uppercase transition-colors"
          >
            Karriqi
          </Link>
          <h1 className="truncate text-lg font-semibold tracking-tight md:text-xl">
            {title}
          </h1>
        </div>
        <UserMenu email={userEmail} />
      </div>
    </header>
  );
}
