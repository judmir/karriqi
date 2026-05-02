import { redirect } from "next/navigation";

import { ArchitectureFlow } from "@/components/dev/architecture/architecture-flow";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/patterns/page-header";
import { PlaceholderPage } from "@/components/patterns/placeholder-page";
import { ROUTES } from "@/config/routes";
import { getDevMenuAccess } from "@/lib/auth/dev-menu-actions";
import { isSupabaseConfigured } from "@/lib/env";

export default async function DevArchitecturePage() {
  if (!isSupabaseConfigured()) {
    return (
      <PageContainer>
        <PlaceholderPage
          segments={["Dev", "Architecture diagram"]}
          note="Connect Supabase to use dev tools."
        />
      </PageContainer>
    );
  }

  const allowed = await getDevMenuAccess();
  if (!allowed) {
    redirect(ROUTES.dashboard);
  }

  return (
    <PageContainer width="wide">
      <div className="space-y-8">
        <PageHeader segments={["Dev", "Architecture diagram"]} />
        <div className="space-y-3">
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">
            Architecture diagram
          </h1>
          <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
            A living view of Karriqi app features, business flows, and
            supporting platform services. Update this diagram when routes,
            features, or notification flows change.
          </p>
        </div>
        <ArchitectureFlow />
      </div>
    </PageContainer>
  );
}
