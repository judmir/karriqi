"use client";

import { useEffect } from "react";

import { ThemeCustomizer } from "@/components/layout/theme-customizer";
import { UserMenu } from "@/components/layout/user-menu";
import {
  useMainLayoutUser,
  type MainLayoutUserState,
} from "@/components/layout/main-layout-user-context";
import { useAppearance } from "@/components/providers/appearance-provider";
import type { AppearanceState } from "@/lib/theme/appearance";

export function AppHeaderUserBridge({
  appearance,
  user,
}: {
  appearance: AppearanceState;
  user: MainLayoutUserState;
}) {
  const { setUser } = useMainLayoutUser();
  const { hydrateAppearance } = useAppearance();

  useEffect(() => {
    setUser(user);
    hydrateAppearance(appearance);
  }, [appearance, hydrateAppearance, setUser, user]);

  return (
    <div className="ml-auto flex items-center gap-2">
      {user.includeThemeCustomizer ? <ThemeCustomizer /> : null}
      <UserMenu
        userId={user.userId}
        email={user.userEmail}
        displayName={user.userDisplayName}
        avatarPreset={user.userAvatarPreset}
      />
    </div>
  );
}

export function UserMenuSkeleton() {
  return (
    <div
      className="bg-muted size-8 animate-pulse rounded-full"
      aria-hidden
    />
  );
}
