"use client";

import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fallbackStyleForSeed, initialsFromName } from "@/lib/avatar/initials";
import {
  type AvatarPresetId,
  avatarPresetSrc,
  isAvatarPresetId,
} from "@/lib/avatar/presets";
import { cn } from "@/lib/utils";

type Size = "default" | "sm" | "lg";

export type UserAvatarProps = {
  /** Stable seed for the deterministic colour of the initials fallback. */
  seed?: string | null;
  /** Used for initials when no preset image renders. */
  displayName?: string | null;
  /** Email used as last-resort source for initials if displayName is empty. */
  email?: string | null;
  /** One of {@link AvatarPresetId} or `null` to force initials. */
  avatarPreset?: string | null;
  size?: Size;
  className?: string;
  fallbackClassName?: string;
  ariaLabel?: string;
};

export function UserAvatar({
  seed,
  displayName,
  email,
  avatarPreset,
  size = "default",
  className,
  fallbackClassName,
  ariaLabel,
}: UserAvatarProps) {
  const initials = initialsFromName(displayName ?? email ?? "");
  const presetId: AvatarPresetId | null = isAvatarPresetId(avatarPreset)
    ? avatarPreset
    : null;
  const fallbackStyle = fallbackStyleForSeed(
    seed ?? displayName ?? email ?? "?",
  );

  return (
    <Avatar size={size} className={className} aria-label={ariaLabel}>
      {presetId ? (
        <AvatarImage
          src={avatarPresetSrc(presetId)}
          alt={ariaLabel ?? displayName ?? "Avatar"}
        />
      ) : null}
      <AvatarFallback
        className={cn("font-semibold", fallbackClassName)}
        style={fallbackStyle}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
