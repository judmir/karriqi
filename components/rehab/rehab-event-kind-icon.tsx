"use client";

import { rehabEventKindVisual } from "@/lib/rehab/rehab-event-kind-visual";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types/calendar";

export function RehabEventKindIcon({
  event,
  size = "md",
  className,
}: {
  event: CalendarEvent;
  size?: "sm" | "md";
  className?: string;
}) {
  const visual = rehabEventKindVisual(event);
  if (!visual) {
    return null;
  }

  const Icon = visual.icon;
  const icon = size === "sm" ? "size-3.5" : "size-4";

  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center", className)}
      title={visual.label}
      aria-hidden
    >
      <Icon
        className={icon}
        strokeWidth={2.25}
        style={{ color: visual.hex }}
      />
    </span>
  );
}
