"use client";

import { CalendarDays, List } from "lucide-react";

import { cn } from "@/lib/utils";

export type RehabUpcomingViewMode = "list" | "calendar";

export function RehabUpcomingViewSwitcher({
  view,
  onViewChange,
  className,
}: {
  view: RehabUpcomingViewMode;
  onViewChange: (view: RehabUpcomingViewMode) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-muted inline-flex items-center rounded-lg p-0.5",
        className,
      )}
      role="group"
      aria-label="Upcoming view"
    >
      <button
        type="button"
        aria-label="List view"
        aria-pressed={view === "list"}
        onClick={() => onViewChange("list")}
        className={cn(
          "inline-flex size-8 cursor-pointer items-center justify-center rounded-md transition-colors",
          view === "list"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <List className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Calendar view"
        aria-pressed={view === "calendar"}
        onClick={() => onViewChange("calendar")}
        className={cn(
          "inline-flex size-8 cursor-pointer items-center justify-center rounded-md transition-colors",
          view === "calendar"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <CalendarDays className="size-4" />
      </button>
    </div>
  );
}
