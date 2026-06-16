"use client";

import { RotateCcw } from "lucide-react";

import {
  isRecurringRehabEvent,
  recurringEventLabel,
  type RecurringEventLike,
} from "@/lib/rehab/rehab-event-recurrence";
import { cn } from "@/lib/utils";

export function RehabRecurringIcon({
  event,
  size = "sm",
  variant = "muted",
  className,
}: {
  event: RecurringEventLike;
  size?: "sm" | "md";
  variant?: "muted" | "inverse";
  className?: string;
}) {
  if (!isRecurringRehabEvent(event)) {
    return null;
  }

  const label = recurringEventLabel(event);
  const iconSize = size === "sm" ? "size-3.5" : "size-4";

  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center", className)}
      title={label}
      aria-label={label}
    >
      <RotateCcw
        className={cn(
          iconSize,
          variant === "inverse" ? "text-white/50" : "text-muted-foreground",
        )}
        aria-hidden
      />
    </span>
  );
}
