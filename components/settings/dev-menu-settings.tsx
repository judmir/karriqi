"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateDevMenuEnabled } from "@/lib/auth/dev-menu-actions";
import { cn } from "@/lib/utils";

export function DevMenuSettings({
  initialEnabled,
}: {
  initialEnabled: boolean;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !enabled;
    startTransition(() => {
      void (async () => {
        const r = await updateDevMenuEnabled(next);
        if (!r.ok) {
          toast.error(r.message);
          return;
        }
        setEnabled(next);
        toast.success(next ? "Dev menu enabled." : "Dev menu hidden.");
        router.refresh();
      })();
    });
  }

  return (
    <div className="max-w-md space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-foreground text-sm font-medium">Dev menu</p>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            Shows a Dev item in navigation with internal test tools (this
            device only).
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          disabled={pending}
          onClick={() => toggle()}
          className={cn(
            "focus-visible:ring-ring relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            enabled ? "bg-primary" : "bg-muted",
          )}
        >
          <span
            className={cn(
              "pointer-events-none block size-6 translate-x-0.5 rounded-full bg-background shadow-sm ring-0 transition-transform",
              enabled && "translate-x-[1.375rem]",
            )}
          />
        </button>
      </div>
    </div>
  );
}
