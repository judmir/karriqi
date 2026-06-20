"use client";

import { usePathname } from "next/navigation";
import { useCallback, type ReactNode } from "react";

import { AppHeader } from "@/components/layout/app-header";
import {
  CALENDAR_CONTENT_SLOT_CLASS,
  MAIN_CONTENT_SLOT_CLASS,
} from "@/components/layout/main-content-slot";
import { MainSectionTitle } from "@/components/layout/main-section-title";
import { MainNavDesktop, MainNavMobile } from "@/components/layout/main-nav";
import { useMainLayoutUser } from "@/components/layout/main-layout-user-context";
import { useAppearance } from "@/components/providers/appearance-provider";
import { InstantNavigationProvider } from "@/components/providers/instant-navigation-provider";
import { isCalendarRoute } from "@/config/routes";
import { useNotificationSubscription } from "@/hooks/use-notification-subscription";
import { cn } from "@/lib/utils";

export function AppShell({
  userMenu,
  children,
}: {
  userMenu: ReactNode;
  children: React.ReactNode;
}) {
  const { userId, includeDevNav, includeRehabNav } = useMainLayoutUser();
  const { setSidebarOpen, sidebarOpen } = useAppearance();
  const pathname = usePathname();
  const calendarRoute = isCalendarRoute(pathname);
  useNotificationSubscription(userId);

  const toggleSidebar = useCallback(
    () => setSidebarOpen((prev) => !prev),
    [setSidebarOpen],
  );

  return (
    <div className="bg-sidebar flex min-h-[100dvh] flex-1 flex-col md:flex-row md:pt-2">
      <MainNavDesktop
        includeDevNav={includeDevNav}
        includeRehabNav={includeRehabNav}
        open={sidebarOpen}
        onToggleSidebar={toggleSidebar}
      />
      <div className="bg-background flex min-h-0 min-h-[100dvh] flex-1 flex-col md:min-h-0 md:overflow-hidden md:rounded-t-2xl">
        <AppHeader>{userMenu}</AppHeader>
        <div
          className={cn(
            calendarRoute
              ? CALENDAR_CONTENT_SLOT_CLASS
              : MAIN_CONTENT_SLOT_CLASS,
            "flex min-h-0 flex-1 flex-col",
          )}
        >
          <InstantNavigationProvider>
            <MainSectionTitle />
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
          </InstantNavigationProvider>
        </div>
      </div>
      <MainNavMobile includeDevNav={includeDevNav} includeRehabNav={includeRehabNav} />
    </div>
  );
}
