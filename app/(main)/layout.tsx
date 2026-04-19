import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { canUseDevMenu } from "@/lib/dev/dev-access";
import { getSessionUser } from "@/lib/supabase/server";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();
  const userEmail = user?.email ?? "Signed in";
  const includeDevNav = canUseDevMenu(user);

  return (
    <AppShell
      userId={user?.id ?? null}
      userEmail={userEmail}
      includeDevNav={includeDevNav}
    >
      <PageContainer>{children}</PageContainer>
    </AppShell>
  );
}
