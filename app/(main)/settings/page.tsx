import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { DevMenuSettings } from "@/components/settings/dev-menu-settings";
import { GoogleCalendarSettings } from "@/components/settings/google-calendar-settings";
import { OpenAiApiKeySettings } from "@/components/settings/openai-api-key-settings";
import { PinSettingsForm } from "@/components/settings/pin-settings-form";
import { PushNotificationsSettings } from "@/components/settings/push-notifications-settings";
import { PageContainer } from "@/components/layout/page-container";
import { PlaceholderPage } from "@/components/patterns/placeholder-page";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOwnPinStatus } from "@/lib/auth/pin-actions";
import { getOwnOpenAiKeyStatus } from "@/lib/home/openai-key-actions";
import { avatarPresetFromUserMeta } from "@/lib/avatar/presets";
import {
  isDevMenuEmail,
  isDevMenuEnabledInMetadata,
} from "@/lib/dev/dev-access";
import { isSupabaseConfigured } from "@/lib/env";
import { getGoogleCalendarConnectionStatus } from "@/lib/google-calendar/connection-actions";
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
  const [pinStatus, googleCalendarStatus, openAiKeyStatus] = await Promise.all([
    getOwnPinStatus(),
    getGoogleCalendarConnectionStatus(user.id),
    getOwnOpenAiKeyStatus(),
  ]);

  return (
    <PageContainer>
      <div className="space-y-8">
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
            <CardTitle>OpenAI API key</CardTitle>
            <CardDescription>
              Powers the Home apartment planner&apos;s AI furnishing and render
              features. Stored encrypted, used server-side only.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OpenAiApiKeySettings
              initialHasKey={openAiKeyStatus.hasKey}
              configured={openAiKeyStatus.configured}
              hint={openAiKeyStatus.hint}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Google Calendar</CardTitle>
            <CardDescription>
              Connect Gmail Calendar for two-way sync with Karriqi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GoogleCalendarSettings initialStatus={googleCalendarStatus} />
          </CardContent>
        </Card>
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
