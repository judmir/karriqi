import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { getSessionUser } from "@/lib/supabase/server";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();
  const userEmail = user?.email ?? "Signed in";

  return (
    <AppShell userId={user?.id ?? null} userEmail={userEmail}>
      <PageContainer>{children}</PageContainer>
    </AppShell>
  );
}
