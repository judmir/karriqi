"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  AVATAR_PRESETS,
  type AvatarPresetId,
} from "@/lib/avatar/presets";
import {
  updateProfileAvatarPreset,
  updateProfileDisplayName,
} from "@/lib/auth/profile-actions";
import { cn } from "@/lib/utils";

type Swatch = { id: AvatarPresetId | null; label: string };

const SWATCHES: readonly Swatch[] = [
  { id: null, label: "Default" },
  ...AVATAR_PRESETS.map((p) => ({ id: p.id, label: p.label })),
];

export function ProfileSettingsForm({
  userId,
  email,
  initialDisplayName,
  initialAvatarPreset,
}: {
  userId: string;
  email: string;
  initialDisplayName: string;
  initialAvatarPreset: AvatarPresetId | null;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [avatarPreset, setAvatarPreset] = useState<AvatarPresetId | null>(
    initialAvatarPreset,
  );
  const [pending, startTransition] = useTransition();

  const nameChanged = displayName.trim() !== initialDisplayName.trim();
  const avatarChanged = avatarPreset !== initialAvatarPreset;
  const dirty = nameChanged || avatarChanged;

  function selectPreset(next: AvatarPresetId | null) {
    if (pending) return;
    setAvatarPreset(next);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!dirty || pending) return;
    startTransition(() => {
      void (async () => {
        if (nameChanged) {
          const r = await updateProfileDisplayName(displayName);
          if (!r.ok) {
            toast.error(r.message);
            return;
          }
        }
        if (avatarChanged) {
          const r = await updateProfileAvatarPreset(avatarPreset);
          if (!r.ok) {
            toast.error(r.message);
            return;
          }
        }
        toast.success("Profile saved.");
        router.refresh();
      })();
    });
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div>
          <p className="text-foreground text-sm font-medium">
            Profile picture
          </p>
          <p className="text-muted-foreground text-xs">
            Your initials on a background colour. Pick one, then hit Save
            profile.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {SWATCHES.map((s) => {
            const selected = avatarPreset === s.id;
            return (
              <button
                key={s.id ?? "default"}
                type="button"
                onClick={() => selectPreset(s.id)}
                disabled={pending}
                aria-pressed={selected}
                aria-label={`Use ${s.label} background`}
                title={s.label}
                className={cn(
                  "ring-offset-background relative rounded-full outline-none transition",
                  "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2",
                  selected
                    ? "ring-primary ring-2 ring-offset-2"
                    : "hover:opacity-90",
                  pending && "cursor-progress opacity-70",
                )}
              >
                <UserAvatar
                  size="lg"
                  seed={userId}
                  displayName={displayName}
                  email={email}
                  avatarPreset={s.id}
                  ariaLabel={s.label}
                />
              </button>
            );
          })}
        </div>
      </section>

      <form onSubmit={onSubmit} className="max-w-md space-y-4">
        <div className="space-y-2">
          <Label htmlFor="profile-email">Email</Label>
          <Input
            id="profile-email"
            value={email}
            readOnly
            className="bg-muted/50 text-muted-foreground"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-display-name">Display name</Label>
          <Input
            id="profile-display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Judi"
            autoComplete="name"
            maxLength={80}
          />
          <p className="text-muted-foreground text-xs leading-relaxed">
            Shown in task assignees and elsewhere instead of your email. You
            can also set this under Supabase → Authentication → Users → User
            metadata (<code className="text-foreground/90">display_name</code>
            ).
          </p>
        </div>
        <Button type="submit" disabled={!dirty || pending}>
          {pending ? "Saving…" : "Save profile"}
        </Button>
      </form>
    </div>
  );
}
