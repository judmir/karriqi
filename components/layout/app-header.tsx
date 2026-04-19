"use client";

import Link from "next/link";

import { KarriqiLogoMark } from "@/components/brand/karriqi-logo";
import { UserMenu } from "@/components/layout/user-menu";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";

export function AppHeader({ userEmail }: { userEmail: string }) {
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
            className="text-muted-foreground hover:text-foreground inline-flex min-w-0 items-center gap-2 text-xs font-medium tracking-wide uppercase transition-colors"
          >
            <KarriqiLogoMark className="size-7 text-primary" />
            <span className="truncate">Karriqi</span>
          </Link>
        </div>
        <UserMenu email={userEmail} />
      </div>
    </header>
  );
}
