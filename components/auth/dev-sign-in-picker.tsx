"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { DEV_TEST_USERS } from "@/lib/auth/dev-test-users";
import { cn } from "@/lib/utils";

function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//")
    ? next
    : ROUTES.dashboard;
}

export function DevSignInPicker({ className }: { className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  async function signInAs(userId: string) {
    if (submittingId) {
      return;
    }
    setSubmittingId(userId);
    try {
      const res = await fetch("/api/auth/dev-login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        let message = "Dev sign-in failed.";
        try {
          const json = (await res.json()) as { message?: string };
          if (json.message) {
            message = json.message;
          }
        } catch {
          // ignore
        }
        toast.error(message);
        return;
      }

      const target = safeNext(searchParams.get("next"));
      router.refresh();
      router.push(target);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Dev sign-in failed.");
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <div
      className={cn(
        "space-y-3 rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 p-3",
        className,
      )}
    >
      <div>
        <p className="text-sm font-medium text-amber-100">Dev sign-in</p>
        <p className="text-muted-foreground text-xs">
          One click — no PIN or password needed in local development.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {DEV_TEST_USERS.map((user) => (
          <Button
            key={user.id}
            type="button"
            variant={user.label === "Judi" ? "default" : "outline"}
            className="min-h-11 h-auto flex-col items-start gap-0.5 px-3 py-2 text-left"
            disabled={submittingId !== null}
            onClick={() => void signInAs(user.id)}
          >
            <span className="font-medium">
              {submittingId === user.id ? "Signing in…" : user.label}
            </span>
            <span className="text-[0.65rem] font-normal opacity-80">
              {user.email}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
