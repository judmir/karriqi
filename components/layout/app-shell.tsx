"use client";

import { AppHeader } from "@/components/layout/app-header";
import { MainNavDesktop, MainNavMobile } from "@/components/layout/main-nav";
import { useNotificationSubscription } from "@/hooks/use-notification-subscription";

export function AppShell({
  userId,
  userEmail,
  children,
}: {
  userId: string | null;
  userEmail: string;
  children: React.ReactNode;
}) {
  useNotificationSubscription(userId);
  return (
    <div className="bg-background flex min-h-[100dvh] flex-1 flex-col md:flex-row">
      <MainNavDesktop />
      <div className="flex min-h-0 min-h-[100dvh] flex-1 flex-col">
        <AppHeader userEmail={userEmail} />
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-[max(5.5rem,calc(4.25rem+env(safe-area-inset-bottom)))] md:pb-8">
          {children}
        </div>
      </div>
      <MainNavMobile />
    </div>
  );
}
