"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileDisplayName } from "@/lib/auth/profile-actions";

export function ProfileSettingsForm({
  email,
  initialDisplayName,
}: {
  email: string;
  initialDisplayName: string;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setDisplayName(initialDisplayName);
  }, [initialDisplayName]);

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

  return (
    <form
      onSubmit={onSubmit}
      className="border-border bg-card/40 max-w-md space-y-4 rounded-xl border p-4"
    >
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
          Shown in task assignees and elsewhere instead of your email. You can
          also set this under Supabase → Authentication → Users → User
          metadata (<code className="text-foreground/90">display_name</code>
          ).
        </p>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
