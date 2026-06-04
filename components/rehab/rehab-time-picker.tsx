"use client";

import { format } from "date-fns";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Period = "AM" | "PM";

type TimeParts = {
  hour12: number;
  minute: number;
  period: Period;
};

function partsFromTime24(time: string): TimeParts | null {
  if (!/^\d{2}:\d{2}$/.test(time)) {
    return null;
  }
  const [hours24, minute] = time.split(":").map(Number);
  if (hours24 > 23 || minute > 59) {
    return null;
  }
  const period: Period = hours24 >= 12 ? "PM" : "AM";
  let hour12 = hours24 % 12;
  if (hour12 === 0) {
    hour12 = 12;
  }
  return { hour12, minute, period };
}

function partsFromDate(date: Date): TimeParts {
  const hours24 = date.getHours();
  const period: Period = hours24 >= 12 ? "PM" : "AM";
  let hour12 = hours24 % 12;
  if (hour12 === 0) {
    hour12 = 12;
  }
  return { hour12, minute: date.getMinutes(), period };
}

function partsToTime24({ hour12, minute, period }: TimeParts): string {
  let hours24: number;
  if (period === "AM") {
    hours24 = hour12 === 12 ? 0 : hour12;
  } else {
    hours24 = hour12 === 12 ? 12 : hour12 + 12;
  }
  return `${String(hours24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function partsToDate(parts: TimeParts): Date {
  const [hours24, minute] = partsToTime24(parts).split(":").map(Number);
  return new Date(2000, 0, 1, hours24, minute, 0, 0);
}

type RehabTimePickerProps = {
  time: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (time: string) => void;
  trigger: React.ReactElement;
};

export function RehabTimePicker({
  time,
  open,
  onOpenChange,
  onSelect,
  trigger,
}: RehabTimePickerProps) {
  const [draft, setDraft] = useState<TimeParts>(() => partsFromTime24(time) ?? partsFromDate(new Date()));

  const displayLabel = useMemo(() => format(partsToDate(draft), "h:mm a"), [draft]);

  function handleOpenChange(next: boolean) {
    if (next) {
      setDraft(partsFromTime24(time) ?? partsFromDate(new Date()));
    }
    onOpenChange(next);
  }

  function apply() {
    onSelect(partsToTime24(draft));
    onOpenChange(false);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger render={trigger} />
      <PopoverContent className="w-[min(100vw-2rem,20rem)] p-4" align="start" side="bottom">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-lg font-semibold tabular-nums">{displayLabel}</p>
          <PeriodToggle
            value={draft.period}
            onChange={(period) => setDraft((current) => ({ ...current, period }))}
          />
        </div>

        <TimeSlider
          label="Hour"
          value={draft.hour12}
          min={1}
          max={12}
          ticks={[1, 6, 12]}
          onChange={(hour12) => setDraft((current) => ({ ...current, hour12 }))}
        />

        <TimeSlider
          label="Minutes"
          value={draft.minute}
          min={0}
          max={59}
          ticks={[0, 30, 59]}
          onChange={(minute) => setDraft((current) => ({ ...current, minute }))}
          className="mt-4"
        />

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={apply}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function PeriodToggle({
  value,
  onChange,
}: {
  value: Period;
  onChange: (period: Period) => void;
}) {
  return (
    <div className="bg-muted/60 flex rounded-lg p-0.5 text-xs font-medium">
      {(["AM", "PM"] as const).map((period) => (
        <button
          key={period}
          type="button"
          onClick={() => onChange(period)}
          className={cn(
            "min-w-10 rounded-md px-2.5 py-1 transition-colors",
            value === period
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {period}
        </button>
      ))}
    </div>
  );
}

function TimeSlider({
  label,
  value,
  min,
  max,
  ticks,
  onChange,
  className,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  ticks: number[];
  onChange: (value: number) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs font-medium">{label}</span>
        <span className="bg-primary/10 text-primary min-w-8 rounded-md px-2 py-0.5 text-center text-xs font-semibold tabular-nums">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="accent-primary h-2 w-full cursor-pointer"
        aria-label={label}
      />
      <div className="text-muted-foreground mt-1 flex justify-between text-[10px] tabular-nums">
        {ticks.map((tick) => (
          <span key={tick}>{String(tick).padStart(2, "0")}</span>
        ))}
      </div>
    </div>
  );
}
