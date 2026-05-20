"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/ui/user-avatar";
import { AVATAR_PRESETS, type AvatarPresetId } from "@/lib/avatar/presets";
import {
  updateProfileAvatarPreset,
  updateProfileDisplayName,
} from "@/lib/auth/profile-actions";
import { cn } from "@/lib/utils";

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
  const [avatarPending, startAvatarTransition] = useTransition();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    startTransition(() => {
      void (async () => {
        const r = await updateProfileDisplayName(displayName);
        if (!r.ok) {
          toast.error(r.message);
          return;
        }
        toast.success("Display name saved.");
        router.refresh();
      })();
    });
  }

  function selectPreset(next: AvatarPresetId | null) {
    if (avatarPending) return;
    if (next === avatarPreset) return;
    const previous = avatarPreset;
    setAvatarPreset(next);
    startAvatarTransition(() => {
      void (async () => {
        const r = await updateProfileAvatarPreset(next);
        if (!r.ok) {
          setAvatarPreset(previous);
          toast.error(r.message);
          return;
        }
        toast.success(
          next === null ? "Back to initials avatar." : "Avatar saved.",
        );
        router.refresh();
      })();
    });
  }

  const groups: { title: string; group: "female" | "male" }[] = [
    { title: "Female characters", group: "female" },
    { title: "Male characters", group: "male" },
  ];

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-center gap-4">
          <UserAvatar
            size="lg"
            seed={userId}
            displayName={displayName}
            email={email}
            avatarPreset={avatarPreset}
            ariaLabel="Current avatar"
          />
          <div className="space-y-1">
            <p className="text-foreground text-sm font-medium">
              Profile picture
            </p>
            <p className="text-muted-foreground text-xs">
              Pick a character — saves automatically. Each has its own
              background so you and your wife are easy to tell apart.
            </p>
          </div>
        </div>

        {groups.map(({ title, group }) => (
          <div key={group} className="space-y-2">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {title}
            </p>
            <div className="flex flex-wrap gap-3">
              {AVATAR_PRESETS.filter((p) => p.group === group).map((p) => {
                const selected = avatarPreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectPreset(p.id)}
                    disabled={avatarPending}
                    aria-pressed={selected}
                    aria-label={`Use ${p.label} avatar`}
                    title={p.label}
                    className={cn(
                      "ring-offset-background relative rounded-full outline-none transition",
                      "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2",
                      selected
                        ? "ring-primary ring-2 ring-offset-2"
                        : "hover:opacity-90",
                      avatarPending && "cursor-progress opacity-70",
                    )}
                  >
                    <UserAvatar
                      size="lg"
                      seed={userId}
                      displayName={displayName}
                      email={email}
                      avatarPreset={p.id}
                      ariaLabel={p.label}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Initials only
          </p>
          <button
            type="button"
            onClick={() => selectPreset(null)}
            disabled={avatarPending}
            aria-pressed={avatarPreset === null}
            aria-label="Use initials avatar"
            className={cn(
              "ring-offset-background relative rounded-full outline-none transition",
              "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2",
              avatarPreset === null
                ? "ring-primary ring-2 ring-offset-2"
                : "hover:opacity-90",
              avatarPending && "cursor-progress opacity-70",
            )}
          >
            <UserAvatar
              size="lg"
              seed={userId}
              displayName={displayName}
              email={email}
              avatarPreset={null}
              ariaLabel="Initials"
            />
          </button>
          <p className="text-muted-foreground text-xs">
            A coloured circle with your initials. Colour is fixed per account.
          </p>
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
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save profile"}
        </Button>
      </form>
    </div>
  );
}
