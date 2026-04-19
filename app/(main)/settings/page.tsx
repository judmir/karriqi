import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { PageHeader } from "@/components/patterns/page-header";
import { PlaceholderPage } from "@/components/patterns/placeholder-page";
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
          email={user.email ?? ""}
          initialDisplayName={initialDisplayName}
        />
      </section>
    </div>
  );
}
