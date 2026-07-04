"use client";

import { Loader2 } from "lucide-react";

import { ListPlaceholder } from "@/components/patterns/list-placeholder";
import { cn } from "@/lib/utils";
import type { CalendarView } from "@/types/calendar";

function MonthGridSkeleton() {
  return (
    <div className="border-border bg-card flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-xl border">
      <div className="border-border grid grid-cols-7 border-b px-2 py-2">
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="bg-muted/60 mx-auto h-3 w-8 animate-pulse rounded-md"
          />
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6">
        {Array.from({ length: 42 }).map((_, index) => (
          <div
            key={index}
            className="border-border/60 border-r border-b p-1 last:border-r-0"
          >
            <div className="bg-muted/50 mb-2 h-4 w-5 animate-pulse rounded-md" />
            <div className="space-y-1">
              <div className="bg-muted/40 h-4 w-full animate-pulse rounded-sm" />
              <div className="bg-muted/30 h-4 w-[80%] animate-pulse rounded-sm" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CalendarEventsLoader({
  view,
  className,
}: {
  view: CalendarView;
  className?: string;
}) {
  return (
    <div
      className={cn("flex h-full min-h-0 flex-1 flex-col gap-3", className)}
      role="status"
      aria-live="polite"
      aria-label="Loading calendar events"
    >
      <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        Loading events…
      </div>
      {view === "month" ? (
        <MonthGridSkeleton />
      ) : (
        <ListPlaceholder
          rows={view === "agenda" ? 8 : 6}
          className="border-border/60 bg-muted/20 min-h-0 flex-1 shadow-none"
        />
      )}
    </div>
  );
}
