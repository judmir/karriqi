"use client";

import { Loader2 } from "lucide-react";

import { ListPlaceholder } from "@/components/patterns/list-placeholder";
import { cn } from "@/lib/utils";

export function UpcomingSearchLoading({
  variant = "skeleton",
  className,
}: {
  variant?: "skeleton" | "overlay";
  className?: string;
}) {
  if (variant === "overlay") {
    return (
      <div
        className={cn(
          "bg-background/70 absolute inset-0 z-10 flex items-start justify-center pt-10 backdrop-blur-[1px]",
          className,
        )}
        role="status"
        aria-live="polite"
        aria-label="Filtering tasks"
      >
        <div className="bg-card text-foreground flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm">
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          Filtering…
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)} role="status" aria-live="polite">
      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        Filtering…
      </div>
      <ListPlaceholder
        rows={5}
        className="border-border/60 bg-muted/20 shadow-none"
      />
    </div>
  );
}
