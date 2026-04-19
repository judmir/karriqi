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
            aria-label="Karriqi home"
            className={cn(
              "text-primary hover:opacity-90 inline-flex shrink-0 items-center rounded-md transition-opacity",
              "focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2",
            )}
          >
            <KarriqiLogoMark className="size-7" />
          </Link>
        </div>
        <UserMenu email={userEmail} />
      </div>
    </header>
  );
}
