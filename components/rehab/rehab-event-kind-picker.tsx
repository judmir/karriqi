"use client";

import { useState } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  rehabEventKindPickerOptions,
  rehabEventKindPickerVisual,
} from "@/lib/rehab/rehab-event-kind-visual";
import { cn } from "@/lib/utils";
import type { CalendarEventColor } from "@/types/calendar";
import type { RehabEventKind } from "@/types/rehab";

const POPOVER_PANEL =
  "w-[min(18rem,calc(100vw-2rem))] border-white/10 bg-[#1c1c1c] p-2 text-white shadow-2xl";

export function RehabEventKindPicker({
  value,
  onChange,
  disabled = false,
  appearance = "sidebar",
}: {
  value: RehabEventKind;
  onChange: (kind: RehabEventKind, defaultColor: CalendarEventColor) => void;
  disabled?: boolean;
  appearance?: "sidebar" | "inline";
}) {
  const [open, setOpen] = useState(false);
  const selected = rehabEventKindPickerVisual(value);
  const SelectedIcon = selected.icon;

  function selectKind(kind: RehabEventKind) {
    const visual = rehabEventKindPickerVisual(kind);
    onChange(kind, visual.defaultColor);
    setOpen(false);
  }

  const options = rehabEventKindPickerOptions(value);

  const grid = (
    <div
      className="grid grid-cols-4 gap-1 sm:grid-cols-5"
      role="listbox"
      aria-label="Event type"
    >
      {options.map((kind) => {
        const visual = rehabEventKindPickerVisual(kind);
        const Icon = visual.icon;
        const active = kind === value;
        return (
          <button
            key={kind}
            type="button"
            role="option"
            aria-selected={active}
            aria-label={visual.label}
            title={visual.label}
            disabled={disabled}
            onClick={() => selectKind(kind)}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-1 rounded-md px-1.5 py-2 text-[10px] leading-none transition-colors",
              "hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-50",
              active && "bg-white/10 ring-1 ring-white/20",
            )}
          >
            <Icon
              className="size-4 shrink-0"
              strokeWidth={2.25}
              style={{ color: visual.hex }}
            />
            <span className="max-w-full truncate text-white/55">{visual.label}</span>
          </button>
        );
      })}
    </div>
  );

  if (appearance === "sidebar") {
    return (
      <div className="min-w-0 w-full space-y-2 px-1.5 pt-2">
        <p className="text-xs text-white/45">Type</p>
        <div className="min-w-0 w-full overflow-hidden">{grid}</div>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={`Type, ${selected.label}`}
            disabled={disabled}
            className={cn(
              "text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors",
              open && "text-foreground bg-muted/60",
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            <SelectedIcon
              className="size-3.5 shrink-0"
              strokeWidth={2.25}
              style={{ color: selected.hex }}
            />
            {selected.label}
          </button>
        }
      />
      <PopoverContent className={POPOVER_PANEL} align="start" side="bottom">
        {grid}
      </PopoverContent>
    </Popover>
  );
}
