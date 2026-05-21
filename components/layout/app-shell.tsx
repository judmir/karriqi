"use client";

import { useCallback, useState, type ReactNode } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { MainNavDesktop, MainNavMobile } from "@/components/layout/main-nav";
import { useMainLayoutUser } from "@/components/layout/main-layout-user-context";
import { useNotificationSubscription } from "@/hooks/use-notification-subscription";

export function AppShell({
  userMenu,
  children,
}: {
  userMenu: ReactNode;
  children: React.ReactNode;
}) {
  const { userId, includeDevNav } = useMainLayoutUser();
  useNotificationSubscription(userId);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = useCallback(
    () => setSidebarOpen((prev) => !prev),
    [],
  );

  return (
    <div className="bg-sidebar flex min-h-[100dvh] flex-1 flex-col md:flex-row md:pt-2">
      <MainNavDesktop includeDevNav={includeDevNav} open={sidebarOpen} />
      <div className="bg-background flex min-h-0 min-h-[100dvh] flex-1 flex-col md:min-h-0 md:overflow-hidden md:rounded-t-2xl">
        <AppHeader sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar}>
          {userMenu}
        </AppHeader>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-[max(5.5rem,calc(4.25rem+env(safe-area-inset-bottom)))] md:pb-0">
          {children}
        </div>
      </div>
      <MainNavMobile includeDevNav={includeDevNav} />
    </div>
  );
}
