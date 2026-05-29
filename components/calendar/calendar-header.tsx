"use client";

import { format } from "date-fns";
import type { MouseEvent } from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from "lucide-react";

import { CalendarGoogleActions } from "@/components/calendar/calendar-google-actions";
import { CalendarReadOnlyInfo } from "@/components/calendar/calendar-readonly-banner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  headerLabel,
  viewLabel,
  viewShortcut,
} from "@/lib/calendar/calendar-utils";
import type { CalendarView } from "@/types/calendar";
import { CALENDAR_VIEWS } from "@/types/calendar";

export function CalendarHeader({
  date,
  view,
  onToday,
  onNavigate,
  onViewChange,
  onNewEvent,
  onSync,
  syncing,
  lastSyncedAt,
  googleEmail,
  readOnly = false,
}: {
  date: Date;
  view: CalendarView;
  onToday: () => void;
  onNavigate: (direction: "prev" | "next") => void;
  onViewChange: (view: CalendarView) => void;
  onNewEvent?: () => void;
  onSync?: () => void;
  syncing?: boolean;
  lastSyncedAt?: string | null;
  googleEmail?: string | null;
  readOnly?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={onToday}>
          Today
        </Button>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Previous"
            onClick={() => onNavigate("prev")}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Next"
            onClick={() => onNavigate("next")}
          >
            <ChevronRightIcon />
          </Button>
        </div>
        <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
          {headerLabel(date, view)}
        </h2>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {onSync ? (
          <CalendarGoogleActions
            googleEmail={googleEmail}
            lastSyncedAt={lastSyncedAt}
            syncing={syncing}
            onSync={onSync}
          />
        ) : null}

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="sm" className="min-w-[7rem] justify-between" />
            }
          >
            {viewLabel(view)}
            <ChevronDownIcon className="opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[10rem]">
            {CALENDAR_VIEWS.map((item) => (
              <DropdownMenuItem
                key={item}
                onClick={() => onViewChange(item)}
                className="justify-between"
              >
                {viewLabel(item)}
                <span className="text-muted-foreground text-xs">
                  {viewShortcut(item)}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {readOnly ? <CalendarReadOnlyInfo /> : null}

        {onNewEvent ? (
          <Button size="sm" onClick={onNewEvent}>
            <PlusIcon />
            New event
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function CalendarWeekdayHeader() {
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return (
    <div className="grid grid-cols-7 border-b border-border">
      {labels.map((label) => (
        <div
          key={label}
          className="text-muted-foreground px-2 py-2 text-center text-xs font-medium sm:text-sm"
        >
          {label}
        </div>
      ))}
    </div>
  );
}

export function CalendarDayNumber({
  day,
  currentMonth,
  isToday,
  onClick,
  className,
}: {
  day: Date;
  currentMonth: Date;
  isToday: boolean;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}) {
  const inMonth = day.getMonth() === currentMonth.getMonth();

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex size-7 cursor-default items-center justify-center rounded-full text-sm",
        isToday ? "bg-primary font-medium text-primary-foreground" : "",
        !inMonth ? "text-muted-foreground/60" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {format(day, "d")}
    </button>
  );
}
