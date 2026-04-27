import { redirect } from "next/navigation";

import { DevPushTest } from "@/components/dev/dev-push-test";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/patterns/page-header";
import { PlaceholderPage } from "@/components/patterns/placeholder-page";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/config/routes";
import { getDevMenuAccess } from "@/lib/auth/dev-menu-actions";
import { isSupabaseConfigured } from "@/lib/env";

export default async function DevPage() {
  if (!isSupabaseConfigured()) {
    return (
      <PageContainer>
        <PlaceholderPage
          eyebrow="Module"
          title="Dev"
          description="Connect Supabase to use dev tools."
        />
      </PageContainer>
    );
  }

  const allowed = await getDevMenuAccess();
  if (!allowed) {
    redirect(ROUTES.dashboard);
  }

  return (
    <PageContainer>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Module"
          title="Dev"
          description="Internal tools for testing app behavior. Only visible when enabled in Settings."
        />
        <Card>
          <CardHeader>
            <CardTitle>Tests</CardTitle>
            <CardDescription>
              One-off tools to exercise app behavior end-to-end.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DevPushTest />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
