"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { KarriqiLogoMark } from "@/components/brand/karriqi-logo";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";

export function AppHeader({ children }: { children: ReactNode }) {
  return (
    <header
      className={cn(
        "border-border bg-background/70 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 shrink-0 border-b backdrop-blur-md",
      )}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex h-16 items-center justify-between gap-2 px-4 md:px-6">
        <Link
          href={ROUTES.dashboard}
          aria-label="Karriqi home"
          className={cn(
            "text-primary hover:opacity-90 inline-flex shrink-0 items-center rounded-md transition-opacity md:hidden",
            "focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2",
          )}
        >
          <KarriqiLogoMark className="size-7" />
        </Link>
        {children}
      </div>
    </header>
  );
}
