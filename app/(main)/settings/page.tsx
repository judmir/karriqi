import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { DevMenuSettings } from "@/components/settings/dev-menu-settings";
import { HouseholdSettingsForm } from "@/components/settings/household-settings-form";
import { PinSettingsForm } from "@/components/settings/pin-settings-form";
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
import { getOwnPinStatus } from "@/lib/auth/pin-actions";
import { avatarPresetFromUserMeta } from "@/lib/avatar/presets";
import {
  isDevMenuEmail,
  isDevMenuEnabledInMetadata,
} from "@/lib/dev/dev-access";
import { isSupabaseConfigured } from "@/lib/env";
import { fetchHouseholdOverview } from "@/lib/household/household-actions";
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

  const meta = user.user_metadata as Record<string, unknown>;
  const initialDisplayName = displayNameFromUserMeta(meta) ?? "";
  const initialAvatarPreset = avatarPresetFromUserMeta(meta);

  const devMenuInitial =
    isDevMenuEmail(user.email) && isDevMenuEnabledInMetadata(meta);
  const pinStatus = await getOwnPinStatus();
  const householdOverview = await fetchHouseholdOverview();

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
              key={`${initialDisplayName || user.id}-${initialAvatarPreset ?? "initials"}`}
              userId={user.id}
              email={user.email ?? ""}
              initialDisplayName={initialDisplayName}
              initialAvatarPreset={initialAvatarPreset}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Household</CardTitle>
            <CardDescription>
              Pair with a partner to share the shopping list, staples, and
              purchase history in real time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HouseholdSettingsForm
              partners={householdOverview?.partners ?? []}
              serviceRoleAvailable={
                householdOverview?.serviceRoleAvailable ?? false
              }
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>PIN sign-in</CardTitle>
            <CardDescription>
              Quick numeric PIN you can type instead of email + password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PinSettingsForm
              initialHasPin={pinStatus.hasPin}
              configured={pinStatus.configured}
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
