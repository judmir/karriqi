"use client";

import {
  addDays,
  addWeeks,
  format,
  isToday,
  isTomorrow,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { CalendarIcon, Check, Clock } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RehabRepeatField } from "@/components/rehab/rehab-repeat-field";
import { RehabEventKindPicker } from "@/components/rehab/rehab-event-kind-picker";
import { RehabTimePicker } from "@/components/rehab/rehab-time-picker";
import { calendarDateToStorage } from "@/lib/calendar/all-day-events";
import {
  combineDateAndTime,
  defaultEventEnd,
  toDateInputValue,
} from "@/lib/calendar/calendar-utils";
import type { RecurrenceRule } from "@/lib/rehab/recurrence";
import { rehabEventKindDefaultColor, rehabEventKindPickerVisual } from "@/lib/rehab/rehab-event-kind-visual";
import { cn } from "@/lib/utils";
import { useRehabPlanStore } from "@/stores/rehab-plan-store";
import type { CalendarEventColor } from "@/types/calendar";
import { MOBILITY_DESCRIPTION } from "@/modules/rehab/neuro-rehab-2026/mobility-routine";
import type { RehabEventKind } from "@/types/rehab";

function dateButtonLabel(date: Date): string {
  if (isToday(date)) {
    return "Today";
  }
  if (isTomorrow(date)) {
    return "Tomorrow";
  }
  return format(date, "d MMM");
}

export type RehabInlineTaskCreated = {
  id: string;
  title: string;
  date: Date;
  startAt: string;
  allDay: boolean;
};

type RehabInlineAddTaskProps = {
  addId: string;
  activeAddId: string | null;
  onActivate: (id: string | null) => void;
  defaultStart: Date;
  onCreated?: (created: RehabInlineTaskCreated) => void;
};

export function RehabInlineAddTask({
  addId,
  activeAddId,
  onActivate,
  defaultStart,
  onCreated,
}: RehabInlineAddTaskProps) {
  const createEvent = useRehabPlanStore((state) => state.createEvent);
  const persistence = useRehabPlanStore((state) => state.persistence);
  const active = activeAddId === addId;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => startOfDay(defaultStart));
  const [time, setTime] = useState("");
  const [pending, setPending] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceRule | null>(null);
  const [eventKind, setEventKind] = useState<RehabEventKind>("custom");
  const [color, setColor] = useState<CalendarEventColor>(
    rehabEventKindDefaultColor("custom"),
  );

  const rootRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setTitle("");
    setDescription("");
    setDate(startOfDay(defaultStart));
    setTime("");
    setDateOpen(false);
    setTimeOpen(false);
    setRecurrence(null);
    setEventKind("custom");
    setColor(rehabEventKindDefaultColor("custom"));
  }, [defaultStart]);

  const cancel = useCallback(() => {
    reset();
    onActivate(null);
  }, [onActivate, reset]);

  useEffect(() => {
    if (!active) {
      return;
    }
    setDate(startOfDay(defaultStart));
    setTime("");
    titleRef.current?.focus();
  }, [active, defaultStart]);

  useEffect(() => {
    if (!active) {
      reset();
    }
  }, [active, reset]);

  useEffect(() => {
    if (!active) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) {
        return;
      }
      if (
        target instanceof Element &&
        target.closest("[data-slot='popover-content']")
      ) {
        return;
      }
      cancel();
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [active, cancel]);

  async function submit() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      cancel();
      return;
    }

    const trimmedTime = time.trim();
    const allDay = trimmedTime.length === 0;
    let startAt: string;
    let endAt: string;

    if (allDay) {
      const day = startOfDay(date);
      startAt = calendarDateToStorage(day);
      endAt = calendarDateToStorage(addDays(day, 1));
    } else {
      const start = combineDateAndTime(toDateInputValue(date), trimmedTime);
      startAt = start.toISOString();
      endAt = defaultEventEnd(start).toISOString();
    }

    setPending(true);
    try {
      const result = await createEvent({
        title: trimmedTitle,
        description: description.trim() || null,
        startAt,
        endAt,
        allDay,
        color,
        eventKind,
        recurrence,
      });

      if (!result.ok) {
        if (persistence) {
          toast.error(result.message);
        }
        return;
      }

      onCreated?.({
        id: result.id,
        title: trimmedTitle,
        date: startOfDay(date),
        startAt,
        allDay,
      });

      reset();
      onActivate(null);
    } finally {
      setPending(false);
    }
  }

  function handleEventKindChange(
    kind: RehabEventKind,
    defaultColor: CalendarEventColor,
  ) {
    const previousLabel = rehabEventKindPickerVisual(eventKind).label;
    setEventKind(kind);
    setColor(defaultColor);
    const nextLabel = rehabEventKindPickerVisual(kind).label;
    if (!title.trim() || title.trim() === previousLabel) {
      setTitle(kind === "custom" ? "" : nextLabel);
    }
    if (kind === "mobility") {
      setDescription(MOBILITY_DESCRIPTION);
    } else if (eventKind === "mobility" && description === MOBILITY_DESCRIPTION) {
      setDescription("");
    }
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      cancel();
      return;
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  }

  if (!active) {
    return (
      <button
        type="button"
        onClick={() => onActivate(addId)}
        className="hover:bg-muted/40 flex w-full items-start gap-3 rounded-lg py-2 pr-2 text-left transition-colors"
      >
        <span
          className="border-muted-foreground/40 mt-0.5 size-4 shrink-0 rounded-full border border-dashed"
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          <span className="text-muted-foreground block text-sm">Add task</span>
          <span className="text-muted-foreground/70 block text-xs">Description</span>
        </span>
      </button>
    );
  }

  return (
    <div
      ref={rootRef}
      className="bg-muted/20 border-border/60 rounded-lg border py-2 pr-2 pl-0"
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-start gap-3">
        <span
          className="border-muted-foreground/40 mt-1.5 ml-3 size-4 shrink-0 rounded-full border border-dashed"
          aria-hidden
        />
        <div className="min-w-0 flex-1 space-y-1">
          <Input
            ref={titleRef}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Add task"
            disabled={pending}
            className="h-8 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description"
            disabled={pending}
            rows={2}
            className={cn(
              "placeholder:text-muted-foreground/70 w-full resize-none bg-transparent text-sm outline-none",
              "text-muted-foreground min-h-8 leading-snug",
            )}
          />

          <div className="flex items-center gap-1 pt-1">
            <DatePickerButton
              date={date}
              open={dateOpen}
              onOpenChange={setDateOpen}
              onSelect={(next) => {
                setDate(startOfDay(next));
                setDateOpen(false);
              }}
              onShortcut={(next) => {
                setDate(startOfDay(next));
                setDateOpen(false);
              }}
            />

            <RehabTimePicker
              time={time}
              open={timeOpen}
              onOpenChange={setTimeOpen}
              onSelect={(next) => {
                setTime(next);
              }}
              trigger={
                <button
                  type="button"
                  aria-label={time ? `Time, ${time}` : "Time"}
                  className={cn(
                    "text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors",
                    timeOpen && "text-foreground bg-muted/60",
                    time && "tabular-nums",
                  )}
                >
                  <Clock className="size-3.5 shrink-0" />
                  {time || "Time"}
                </button>
              }
            />

            <RehabEventKindPicker
              value={eventKind}
              onChange={handleEventKindChange}
              disabled={pending}
              appearance="inline"
            />

            <RehabRepeatField
              value={recurrence}
              startDate={date}
              onChange={setRecurrence}
              disabled={pending}
              appearance="inline"
            />

            <button
              type="button"
              onClick={() => void submit()}
              disabled={pending || title.trim().length === 0}
              className="text-emerald-600 hover:bg-muted/60 hover:text-emerald-500 ml-auto inline-flex cursor-pointer items-center rounded-md p-1.5 transition-colors disabled:pointer-events-none disabled:opacity-40 dark:text-emerald-400 dark:hover:text-emerald-300"
              aria-label="Create task"
              title="Create task"
            >
              <Check className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DatePickerButton({
  date,
  open,
  onOpenChange,
  onSelect,
  onShortcut,
}: {
  date: Date;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (date: Date) => void;
  onShortcut: (date: Date) => void;
}) {
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const nextWeek = startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 });

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              "text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors",
              open && "text-foreground bg-muted/60",
            )}
          >
            <CalendarIcon className="size-3.5 shrink-0" />
            {dateButtonLabel(date)}
          </button>
        }
      />
      <PopoverContent className="w-auto p-0" align="start" side="bottom">
        <div className="border-border/60 border-b px-3 py-2 text-xs tabular-nums">
          {format(date, "dd-MM-yyyy")}
        </div>
        <div className="flex flex-col py-1">
          <ShortcutButton
            icon={<CalendarIcon className="size-3.5" />}
            label="Today"
            onClick={() => onShortcut(today)}
          />
          <ShortcutButton
            icon={<CalendarIcon className="size-3.5" />}
            label="Tomorrow"
            onClick={() => onShortcut(tomorrow)}
          />
          <ShortcutButton
            icon={<CalendarIcon className="size-3.5" />}
            label="Next week"
            onClick={() => onShortcut(nextWeek)}
          />
        </div>
        <Calendar
          mode="single"
          selected={date}
          onSelect={(next) => {
            if (next) {
              onSelect(next);
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function ShortcutButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hover:bg-muted/60 flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs transition-colors"
    >
      <span className="text-muted-foreground">{icon}</span>
      {label}
    </button>
  );
}
