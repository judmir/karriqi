"use client";

import { ChevronDownIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { toggleGoogleCalendarSourceAction } from "@/lib/google-calendar/source-actions";
import { cn } from "@/lib/utils";
import type { GoogleCalendarSource } from "@/types/calendar";

import { Checkbox } from "@/components/ui/checkbox";

export function CalendarSourcesSidebar({
  sources,
  onSourcesChange,
  className,
}: {
  sources: GoogleCalendarSource[];
  onSourcesChange: (sources: GoogleCalendarSource[]) => void;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const [pending, startTransition] = useTransition();

  if (sources.length === 0) {
    return null;
  }

  function handleToggle(
    source: GoogleCalendarSource,
    selected: boolean,
  ) {
    onSourcesChange(
      sources.map((item) =>
        item.googleCalendarId === source.googleCalendarId
          ? { ...item, selected }
          : item,
      ),
    );

    startTransition(async () => {
      const result = await toggleGoogleCalendarSourceAction({
        googleCalendarId: source.googleCalendarId,
        selected,
      });
      if (!result.ok) {
        onSourcesChange(sources);
        toast.error(result.message);
      }
    });
  }

  return (
    <aside
      className={cn(
        "flex w-full shrink-0 flex-col rounded-xl border border-border bg-card md:w-56 lg:w-60",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full cursor-default items-center justify-between px-3 py-2.5 text-left text-sm font-medium"
      >
        My calendars
        <ChevronDownIcon
          className={cn(
            "text-muted-foreground size-4 transition-transform",
            expanded && "rotate-180",
          )}
        />
      </button>

      {expanded ? (
        <ul
          className={cn(
            "space-y-0.5 px-2 pb-3",
            pending && "opacity-70",
          )}
        >
          {sources.map((source) => (
            <li key={source.googleCalendarId}>
              <label className="hover:bg-muted/40 flex cursor-default items-center gap-2 rounded-md px-1.5 py-1.5 text-sm">
                <Checkbox
                  checked={source.selected}
                  onCheckedChange={(value) =>
                    handleToggle(source, Boolean(value))
                  }
                  className="rounded-[4px]"
                  style={{
                    backgroundColor: source.selected
                      ? source.backgroundColor
                      : undefined,
                    borderColor: source.backgroundColor,
                  }}
                />
                <span className="min-w-0 truncate">{source.summary}</span>
              </label>
            </li>
          ))}
        </ul>
      ) : null}
    </aside>
  );
}
