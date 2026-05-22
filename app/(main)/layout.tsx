import { Suspense } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { UserMenuSkeleton } from "@/components/layout/app-header-user-bridge";
import { AppHeaderUserLoader } from "@/components/layout/app-header-user-loader";
import { MainLayoutUserProvider } from "@/components/layout/main-layout-user-context";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <MainLayoutUserProvider>
      <AppShell
        userMenu={
          <Suspense fallback={<UserMenuSkeleton />}>
            <AppHeaderUserLoader />
          </Suspense>
        }
      >
        {children}
      </AppShell>
    </MainLayoutUserProvider>
  );
}
