import { redirect } from "next/navigation";

import { DevPushTest } from "@/components/dev/dev-push-test";
import { PageHeader } from "@/components/patterns/page-header";
import { PlaceholderPage } from "@/components/patterns/placeholder-page";
import { ROUTES } from "@/config/routes";
import { getDevMenuAccess } from "@/lib/auth/dev-menu-actions";
import { isSupabaseConfigured } from "@/lib/env";

export default async function DevPage() {
  if (!isSupabaseConfigured()) {
    return (
      <PlaceholderPage
        eyebrow="Module"
        title="Dev"
        description="Connect Supabase to use dev tools."
      />
    );
  }

  const allowed = await getDevMenuAccess();
  if (!allowed) {
    redirect(ROUTES.dashboard);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Module"
        title="Dev"
        description="Internal tools for testing app behavior. Only visible when enabled in Settings."
      />
      <section className="space-y-3">
        <h2 className="text-foreground text-sm font-semibold">Tests</h2>
        <DevPushTest />
      </section>
    </div>
  );
}
