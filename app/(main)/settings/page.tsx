import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { DevMenuSettings } from "@/components/settings/dev-menu-settings";
import { PushNotificationsSettings } from "@/components/settings/push-notifications-settings";
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
import {
  isDevMenuEmail,
  isDevMenuEnabledInMetadata,
} from "@/lib/dev/dev-access";
import { isSupabaseConfigured } from "@/lib/env";
import { getSessionUser } from "@/lib/supabase/server";
import { displayNameFromUserMeta } from "@/lib/todo/assignable-members";

export default async function SettingsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <PageContainer>
        <PlaceholderPage
          segments={["Settings"]}
          note="Connect Supabase to manage your profile and preferences."
        />
      </PageContainer>
    );
  }

  const user = await getSessionUser();
  if (!user) {
    return (
      <PageContainer>
        <PlaceholderPage
          segments={["Settings"]}
          note="Sign in to edit your profile."
        />
      </PageContainer>
    );
  }

  const initialDisplayName =
    displayNameFromUserMeta(
      user.user_metadata as Record<string, unknown>,
    ) ?? "";

  const meta = user.user_metadata as Record<string, unknown>;
  const devMenuInitial =
    isDevMenuEmail(user.email) && isDevMenuEnabledInMetadata(meta);

  return (
    <PageContainer>
      <div className="space-y-8">
        <PageHeader segments={["Settings"]} />
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Display name and email used across the app.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileSettingsForm
              key={initialDisplayName || user.id}
              email={user.email ?? ""}
              initialDisplayName={initialDisplayName}
            />
          </CardContent>
        </Card>
        {isDevMenuEmail(user.email) ? (
          <Card>
            <CardHeader>
              <CardTitle>Developer</CardTitle>
              <CardDescription>
                Internal tools menu. Only visible to you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DevMenuSettings initialEnabled={devMenuInitial} />
            </CardContent>
          </Card>
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Push notifications for reminders and updates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PushNotificationsSettings />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
