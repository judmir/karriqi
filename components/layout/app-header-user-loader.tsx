import { AppHeaderUserBridge } from "@/components/layout/app-header-user-bridge";
import { avatarPresetFromUserMeta } from "@/lib/avatar/presets";
import { canUseDevMenu } from "@/lib/dev/dev-access";
import { getSessionUser } from "@/lib/supabase/server";
import { displayNameFromUserMeta } from "@/lib/todo/assignable-members";

export async function AppHeaderUserLoader() {
  const user = await getSessionUser();
  const meta = (user?.user_metadata ?? null) as Record<string, unknown> | null;

  return (
    <AppHeaderUserBridge
      user={{
        userId: user?.id ?? null,
        userEmail: user?.email ?? "Signed in",
        userDisplayName: displayNameFromUserMeta(meta),
        userAvatarPreset: avatarPresetFromUserMeta(meta),
        includeDevNav: canUseDevMenu(user),
      }}
    />
  );
}
