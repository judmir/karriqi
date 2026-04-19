import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { DevMenuSettings } from "@/components/settings/dev-menu-settings";
import { PushNotificationsSettings } from "@/components/settings/push-notifications-settings";
import { PageHeader } from "@/components/patterns/page-header";
import { PlaceholderPage } from "@/components/patterns/placeholder-page";
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
      <PlaceholderPage
        eyebrow="Module"
        title="Settings"
        description="Connect Supabase to manage your profile and preferences."
      />
    );
  }

  const user = await getSessionUser();
  if (!user) {
    return (
      <PlaceholderPage
        eyebrow="Module"
        title="Settings"
        description="Sign in to edit your profile."
      />
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
    <div className="space-y-8">
      <PageHeader
        eyebrow="Module"
        title="Settings"
        description="Account details used across the app."
      />
      <section className="space-y-3">
        <h2 className="text-foreground text-sm font-semibold">Profile</h2>
        <ProfileSettingsForm
          key={initialDisplayName || user.id}
          email={user.email ?? ""}
          initialDisplayName={initialDisplayName}
        />
      </section>
      {isDevMenuEmail(user.email) ? (
        <section className="space-y-3">
          <h2 className="text-foreground text-sm font-semibold">Developer</h2>
          <DevMenuSettings initialEnabled={devMenuInitial} />
        </section>
      ) : null}
      <section className="space-y-3">
        <h2 className="text-foreground text-sm font-semibold">Notifications</h2>
        <PushNotificationsSettings />
      </section>
    </div>
  );
}
