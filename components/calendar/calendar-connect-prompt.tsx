"use client";

import { CalendarIcon, LockIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";

type CalendarConnectPromptProps = {
  configured: boolean;
};

export function CalendarConnectPrompt({
  configured,
}: CalendarConnectPromptProps) {
  const searchParams = useSearchParams();
  const shownError = useRef(false);

  useEffect(() => {
    const error = searchParams.get("google_error");
    if (!error || shownError.current) {
      return;
    }
    shownError.current = true;
    toast.error(decodeURIComponent(error));
  }, [searchParams]);

  return (
    <div className="bg-background/80 relative flex h-full min-h-0 flex-1 flex-col items-center justify-center p-4 backdrop-blur-sm md:p-6">
      <div
        className="border-border bg-card flex w-full max-w-md flex-col items-center gap-5 rounded-xl border p-6 text-center shadow-lg"
        role="alertdialog"
        aria-labelledby="calendar-connect-title"
        aria-describedby="calendar-connect-description"
      >
        <div className="relative">
          <div className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-full">
            <CalendarIcon className="size-7" aria-hidden />
          </div>
          <div className="bg-muted border-background absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full border-2">
            <LockIcon className="text-muted-foreground size-3.5" aria-hidden />
          </div>
        </div>

        <div className="space-y-2">
          <h1 id="calendar-connect-title" className="text-lg font-semibold">
            Connect Google Calendar to continue
          </h1>
          <p
            id="calendar-connect-description"
            className="text-muted-foreground text-sm leading-relaxed"
          >
            Karriqi calendar requires a linked Google account. Events sync both
            ways with your primary Google Calendar once connected.
          </p>
        </div>

        {configured ? (
          <a
            href="/api/integrations/google/calendar/authorize"
            className={buttonVariants({ className: "w-full sm:w-auto" })}
          >
            Connect Google Calendar
          </a>
        ) : (
          <div className="space-y-3">
            <p className="text-amber-300 text-sm leading-relaxed">
              Google OAuth is not configured on this server yet. Add{" "}
              <code className="text-foreground/90">GOOGLE_CLIENT_ID</code> and{" "}
              <code className="text-foreground/90">GOOGLE_CLIENT_SECRET</code>{" "}
              to this worktree&apos;s{" "}
              <code className="text-foreground/90">.env.local</code>, save the
              file, then restart the dev server.
            </p>
            <span
              className={cn(
                buttonVariants({ className: "w-full sm:w-auto" }),
                "pointer-events-none opacity-50",
              )}
              aria-disabled
            >
              Connect Google Calendar
            </span>
          </div>
        )}

        <p className="text-muted-foreground text-xs">
          Manage connection in{" "}
          <Link href={ROUTES.settings} className="text-foreground underline">
            Settings
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
