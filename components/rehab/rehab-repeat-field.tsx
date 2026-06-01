"use client";

import { getDay } from "date-fns";
import { RotateCcw } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  WEEKDAY_LABELS,
  WEEKDAY_ORDER,
  type RecurrenceFreq,
  type RecurrenceRule,
} from "@/lib/rehab/recurrence";
import { cn } from "@/lib/utils";

const FREQ_OPTIONS: { value: RecurrenceFreq; label: string }[] = [
  { value: "daily", label: "day" },
  { value: "weekly", label: "week" },
  { value: "monthly", label: "month" },
  { value: "yearly", label: "year" },
];

const POPOVER_PANEL =
  "w-72 overflow-hidden border-white/10 bg-[#1c1c1c] p-0 text-white shadow-2xl";

export function RehabRepeatField({
  value,
  startDate,
  onChange,
  disabled = false,
  appearance = "sidebar",
}: {
  value: RecurrenceRule | null;
  startDate: Date;
  onChange: (rule: RecurrenceRule | null) => void;
  disabled?: boolean;
  /** `sidebar` = dark modal aside; `inline` = list quick-add row next to Today/Time */
  appearance?: "sidebar" | "inline";
}) {
  const [open, setOpen] = useState(false);
  const [freq, setFreq] = useState<RecurrenceFreq>(value?.freq ?? "weekly");
  const [interval, setInterval] = useState(value?.interval ?? 1);
  const [weekdays, setWeekdays] = useState<number[]>(
    value?.weekdays ?? [getDay(startDate)],
  );
  const [endsOn, setEndsOn] = useState<"never" | "on">(
    value?.until ? "on" : "never",
  );
  const [until, setUntil] = useState(value?.until ?? "");

  function resetFromValue() {
    setFreq(value?.freq ?? "weekly");
    setInterval(value?.interval ?? 1);
    setWeekdays(value?.weekdays ?? [getDay(startDate)]);
    setEndsOn(value?.until ? "on" : "never");
    setUntil(value?.until ?? "");
  }

  function toggleWeekday(day: number) {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  function save() {
    const rule: RecurrenceRule = {
      freq,
      interval: Math.max(1, interval),
    };
    if (freq === "weekly") {
      rule.weekdays = weekdays.length > 0 ? weekdays : [getDay(startDate)];
    }
    if (endsOn === "on" && until) {
      rule.until = until;
    }
    onChange(rule);
    setOpen(false);
  }

  const trigger =
    appearance === "inline" ? (
      <button
        type="button"
        disabled={disabled}
        aria-label="Repeat"
        className={cn(
          "inline-flex cursor-pointer items-center rounded-md px-2 py-1 text-xs transition-colors",
          value
            ? "text-foreground bg-muted/60"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
          open && "text-foreground bg-muted/60",
        )}
      >
        <RotateCcw className="size-3.5 shrink-0" aria-hidden />
      </button>
    ) : (
      <Button
        variant="ghost"
        className={cn(
          "self-start rounded-md p-1.5 transition-colors hover:bg-white/8",
          value ? "text-white/80" : "text-white/35 hover:text-white/70",
        )}
        disabled={disabled}
        aria-label="Repeat"
      />
    );

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (disabled) {
          return;
        }
        if (next) {
          resetFromValue();
        }
        setOpen(next);
      }}
    >
      <PopoverTrigger render={trigger}>
        {appearance === "sidebar" ? (
          <RotateCcw className="size-4" aria-hidden />
        ) : null}
      </PopoverTrigger>
      <PopoverContent
        className={cn(POPOVER_PANEL)}
        align={appearance === "inline" ? "start" : "end"}
        side="bottom"
      >
        <RepeatPopoverBody
          freq={freq}
          setFreq={setFreq}
          interval={interval}
          setInterval={setInterval}
          weekdays={weekdays}
          toggleWeekday={toggleWeekday}
          endsOn={endsOn}
          setEndsOn={setEndsOn}
          until={until}
          setUntil={setUntil}
          onCancel={() => setOpen(false)}
          onClear={() => {
            onChange(null);
            setOpen(false);
          }}
          onSave={save}
        />
      </PopoverContent>
    </Popover>
  );
}

function RepeatPopoverBody({
  freq,
  setFreq,
  interval,
  setInterval,
  weekdays,
  toggleWeekday,
  endsOn,
  setEndsOn,
  until,
  setUntil,
  onCancel,
  onClear,
  onSave,
}: {
  freq: RecurrenceFreq;
  setFreq: (freq: RecurrenceFreq) => void;
  interval: number;
  setInterval: (n: number) => void;
  weekdays: number[];
  toggleWeekday: (day: number) => void;
  endsOn: "never" | "on";
  setEndsOn: (v: "never" | "on") => void;
  until: string;
  setUntil: (v: string) => void;
  onCancel: () => void;
  onClear: () => void;
  onSave: () => void;
}) {
  return (
    <>
      <div className="space-y-3 p-3">
        <p className="text-sm font-semibold text-white">Repeat</p>

        <div className="flex flex-wrap items-center gap-2 text-sm text-white/80">
          <span>Repeat every</span>
          <input
            type="number"
            min={1}
            value={interval}
            onChange={(e) =>
              setInterval(Math.max(1, Number(e.target.value) || 1))
            }
            className="h-7 w-12 rounded-md border border-white/10 bg-white/8 px-2 text-center outline-none focus-visible:border-white/30"
          />
          <div className="flex overflow-hidden rounded-md border border-white/10">
            {FREQ_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFreq(option.value)}
                className={cn(
                  "px-2.5 py-1 text-xs transition-colors",
                  freq === option.value
                    ? "bg-white text-black"
                    : "text-white/60 hover:bg-white/8 hover:text-white",
                )}
              >
                {option.label}
                {interval > 1 ? "s" : ""}
              </button>
            ))}
          </div>
        </div>

        {freq === "weekly" ? (
          <div className="space-y-1.5">
            <span className="text-xs text-white/55">Each</span>
            <div className="flex gap-1">
              {WEEKDAY_ORDER.map((day) => {
                const selected = weekdays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleWeekday(day)}
                    aria-pressed={selected}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-md text-xs transition-colors",
                      selected
                        ? "bg-indigo-500 font-semibold text-white"
                        : "bg-white/8 text-white/60 hover:bg-white/15 hover:text-white",
                    )}
                  >
                    {WEEKDAY_LABELS[day]}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="space-y-1.5">
          <span className="text-xs text-white/55">Ends</span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setEndsOn("never")}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-sm transition-colors",
                endsOn === "never"
                  ? "bg-white font-semibold text-black"
                  : "bg-white/8 text-white/60 hover:bg-white/15 hover:text-white",
              )}
            >
              Never
            </button>
            <button
              type="button"
              onClick={() => setEndsOn("on")}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-sm transition-colors",
                endsOn === "on"
                  ? "bg-white font-semibold text-black"
                  : "bg-white/8 text-white/60 hover:bg-white/15 hover:text-white",
              )}
            >
              On date
            </button>
          </div>
          {endsOn === "on" ? (
            <input
              type="date"
              value={until}
              onChange={(e) => setUntil(e.target.value)}
              className="h-8 w-full rounded-md border border-white/10 bg-white/8 px-2 text-sm text-white outline-none focus-visible:border-white/30"
            />
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/8 px-3 py-2">
        <button
          type="button"
          onClick={onClear}
          className="rounded-md px-2 py-1.5 text-sm text-white/55 transition-colors hover:bg-white/8 hover:text-white"
        >
          Don&apos;t repeat
        </button>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-3 py-1.5 text-sm text-white/60 transition-colors hover:bg-white/8 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-400"
          >
            Save
          </button>
        </div>
      </div>
    </>
  );
}
