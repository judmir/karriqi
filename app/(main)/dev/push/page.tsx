import { redirect } from "next/navigation";

import { DevPushTest } from "@/components/dev/push/dev-push-test";
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

export default async function DevPushPage() {
  if (!isSupabaseConfigured()) {
    return (
      <PageContainer>
        <PlaceholderPage
          segments={["Dev", "Push notifications"]}
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
    <PageContainer>
      <div className="space-y-8">
        <PageHeader segments={["Dev", "Push notifications"]} />
        <Card>
          <CardHeader>
            <CardTitle>Push notification test</CardTitle>
            <CardDescription>
              One-off tools to exercise web push delivery end-to-end.
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
