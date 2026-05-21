"use client";

import { useEffect } from "react";

import { UserMenu } from "@/components/layout/user-menu";
import {
  useMainLayoutUser,
  type MainLayoutUserState,
} from "@/components/layout/main-layout-user-context";

export function AppHeaderUserBridge({
  user,
}: {
  user: MainLayoutUserState;
}) {
  const { setUser } = useMainLayoutUser();

  useEffect(() => {
    setUser(user);
  }, [setUser, user]);

  return (
    <UserMenu
      userId={user.userId}
      email={user.userEmail}
      displayName={user.userDisplayName}
      avatarPreset={user.userAvatarPreset}
    />
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
