"use client";

import { PanelLeft } from "lucide-react";
import Link from "next/link";

import { KarriqiLogoMark } from "@/components/brand/karriqi-logo";
import { UserMenu } from "@/components/layout/user-menu";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";

export function AppHeader({
  userEmail,
  sidebarOpen,
  onToggleSidebar,
}: {
  userEmail: string;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}) {
  return (
    <header
      className={cn(
        "border-border bg-background/70 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 border-b backdrop-blur-md",
      )}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex h-16 items-center justify-between gap-2 px-4 md:px-6">
        <button
          type="button"
          className={cn(
            "text-muted-foreground hover:text-foreground hidden size-7 shrink-0 items-center justify-center bg-transparent transition-colors md:inline-flex",
            "focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2",
          )}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-expanded={sidebarOpen}
          onClick={onToggleSidebar}
        >
          <PanelLeft className="size-4" aria-hidden />
        </button>
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
        <UserMenu email={userEmail} />
      </div>
    </header>
  );
}
