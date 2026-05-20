import { AppShell } from "@/components/layout/app-shell";
import { avatarPresetFromUserMeta } from "@/lib/avatar/presets";
import { canUseDevMenu } from "@/lib/dev/dev-access";
import { getSessionUser } from "@/lib/supabase/server";
import { displayNameFromUserMeta } from "@/lib/todo/assignable-members";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();
  const userEmail = user?.email ?? "Signed in";
  const includeDevNav = canUseDevMenu(user);
  const meta = (user?.user_metadata ?? null) as Record<string, unknown> | null;
  const userDisplayName = displayNameFromUserMeta(meta);
  const userAvatarPreset = avatarPresetFromUserMeta(meta);

  return (
    <AppShell
      userId={user?.id ?? null}
      userEmail={userEmail}
      userDisplayName={userDisplayName}
      userAvatarPreset={userAvatarPreset}
      includeDevNav={includeDevNav}
    >
      {children}
    </AppShell>
  );
}
