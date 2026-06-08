"use client";

import { addDays, addMilliseconds, format, startOfDay } from "date-fns";
import {
  BellOff,
  CalendarIcon,
  Clock3,
  ExternalLink,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  allDayInclusiveEndForForm,
  calendarDateToStorage,
} from "@/lib/calendar/all-day-events";
import {
  combineDateAndTime,
  defaultEventEnd,
  toDateInputValue,
  toTimeInputValue,
} from "@/lib/calendar/calendar-utils";
import {
  calendarEventActionsFor,
  type CalendarClientVariant,
} from "@/lib/calendar/calendar-event-actions";
import {
  parseEventDescription,
  serializeEventDescription,
  subtasksEqual,
  type EventSubtask,
} from "@/lib/calendar/event-subtasks";
import {
  describeRecurrence,
  rulesEqual,
  type RecurrenceRule,
} from "@/lib/rehab/recurrence";
import { RehabRepeatField } from "@/components/rehab/rehab-repeat-field";
import {
  useRehabPlanStore,
  type SeriesEditScope,
} from "@/stores/rehab-plan-store";
import { cn } from "@/lib/utils";
import type { CalendarEvent, CalendarEventColor } from "@/types/calendar";
import type { RehabPlanEvent } from "@/types/rehab";

type EventFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
  defaultStart: Date;
  persistence: boolean;
  readOnly?: boolean;
  variant?: CalendarClientVariant;
  defaultAllDay?: boolean;
  onSaved: (event: CalendarEvent) => void;
  onDeleted: (id: string) => void;
};

export function EventFormDialog({
  open,
  onOpenChange,
  event,
  defaultStart,
  persistence,
  readOnly = false,
  variant = "family",
  defaultAllDay = false,
  onSaved,
  onDeleted,
}: EventFormDialogProps) {
  const closeRequestRef = useRef<(() => void | Promise<void>) | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          onOpenChange(true);
          return;
        }
        void closeRequestRef.current?.();
      }}
    >
      {open ? (
        <EventFormDialogBody
          key={
            event?.id ??
            `${defaultStart.toISOString()}:${defaultAllDay ? "1" : "0"}`
          }
          closeRequestRef={closeRequestRef}
          event={event}
          defaultStart={defaultStart}
          persistence={persistence}
          readOnly={readOnly}
          variant={variant}
          defaultAllDay={defaultAllDay}
          onOpenChange={onOpenChange}
          onSaved={onSaved}
          onDeleted={onDeleted}
        />
      ) : null}
    </Dialog>
  );
}

function EventFormDialogBody({
  closeRequestRef,
  event,
  defaultStart,
  persistence,
  readOnly = false,
  variant = "family",
  defaultAllDay = false,
  onOpenChange,
  onSaved,
  onDeleted,
}: Omit<EventFormDialogProps, "open"> & {
  closeRequestRef: React.MutableRefObject<(() => void | Promise<void>) | null>;
}) {
  const actions = calendarEventActionsFor(variant);
  const editSeries = useRehabPlanStore((s) => s.editSeries);
  const deleteOccurrence = useRehabPlanStore((s) => s.deleteOccurrence);
  const isEditing = event !== null;
  const viewOnly = readOnly;
  const isRehab = variant === "rehab";
  const rehabEvent = event as (CalendarEvent & Partial<RehabPlanEvent>) | null;
  /** Editing an existing occurrence of a recurring series. */
  const isSeriesOccurrence =
    isRehab && isEditing && Boolean(rehabEvent?.recurrenceAt);
  const initialStart = event ? new Date(event.startAt) : defaultStart;
  const initialEnd = event
    ? event.allDay
      ? allDayInclusiveEndForForm(event)
      : new Date(event.endAt)
    : defaultEventEnd(defaultStart);
  const initialDurationMs = Math.max(
    30 * 60 * 1000,
    initialEnd.getTime() - initialStart.getTime(),
  );

  const initialParsed = parseEventDescription(event?.description ?? null);

  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(initialParsed.description);
  const [subtasks, setSubtasks] = useState<EventSubtask[]>(
    initialParsed.subtasks,
  );
  const allDay = event?.allDay ?? defaultAllDay;
  const color: CalendarEventColor = event?.color ?? "blue";
  const [startDate, setStartDate] = useState(initialStart);
  const [endDate, setEndDate] = useState(initialEnd);
  const [startTime, setStartTime] = useState(toTimeInputValue(initialStart));
  const [endTime, setEndTime] = useState(toTimeInputValue(initialEnd));
  const [showTime, setShowTime] = useState(!allDay);
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const initialRecurrence: RecurrenceRule | null = isRehab
    ? (rehabEvent?.recurrence ?? null)
    : null;
  const [recurrence, setRecurrence] = useState<RecurrenceRule | null>(
    initialRecurrence,
  );
  const [editScopePrompt, setEditScopePrompt] = useState(false);
  const [deleteScopePrompt, setDeleteScopePrompt] = useState(false);
  const effectiveAllDay = allDay || !showTime;
  const recurrenceChanged =
    isRehab && !rulesEqual(recurrence, initialRecurrence);
  const hasChanges =
    title !== (event?.title ?? "") ||
    description !== initialParsed.description ||
    !subtasksEqual(subtasks, initialParsed.subtasks) ||
    effectiveAllDay !== (event?.allDay ?? defaultAllDay) ||
    color !== (event?.color ?? "blue") ||
    toDateInputValue(startDate) !== toDateInputValue(initialStart) ||
    startTime !== toTimeInputValue(initialStart) ||
    recurrenceChanged;

  function storedDescription(): string | null {
    return serializeEventDescription(description, subtasks);
  }

  function updateStart(nextStart: Date) {
    setStartDate(nextStart);
    setStartTime(toTimeInputValue(nextStart));
    setEndDate(addMilliseconds(nextStart, initialDurationMs));
    setEndTime(toTimeInputValue(addMilliseconds(nextStart, initialDurationMs)));
  }

  function updateStartDate(nextDate: Date) {
    const next = combineDateAndTime(toDateInputValue(nextDate), startTime);
    updateStart(next);
  }

  function updateStartTime(nextTime: string) {
    const next = combineDateAndTime(toDateInputValue(startDate), nextTime);
    updateStart(next);
  }

  function buildIsoRange(): { startAt: string; endAt: string } | null {
    if (effectiveAllDay) {
      const start = startOfDay(startDate);
      const endInclusive = startOfDay(endDate);
      if (endInclusive < start) {
        toast.error("End date must be on or after start date.");
        return null;
      }
      const endExclusive = addDays(endInclusive, 1);
      return {
        startAt: calendarDateToStorage(start),
        endAt: calendarDateToStorage(endExclusive),
      };
    }

    const start = combineDateAndTime(toDateInputValue(startDate), startTime);
    const end = combineDateAndTime(toDateInputValue(endDate), endTime);
    if (end < start) {
      toast.error("End must be after start.");
      return null;
    }
    return { startAt: start.toISOString(), endAt: end.toISOString() };
  }

  async function handleSubmit() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error("Title is required.");
      return;
    }

    const range = buildIsoRange();
    if (!range) {
      return;
    }

    // Editing an occurrence of a recurring series: let the user pick the scope.
    if (isSeriesOccurrence) {
      setEditScopePrompt(true);
      return;
    }

    const nextDescription = storedDescription();

    if (!persistence) {
      const now = new Date().toISOString();
      onSaved({
        id: event?.id ?? crypto.randomUUID(),
        userId: event?.userId ?? "local",
        title: trimmedTitle,
        description: nextDescription,
        startAt: range.startAt,
        endAt: range.endAt,
        allDay: effectiveAllDay,
        color,
        createdAt: event?.createdAt ?? now,
        updatedAt: now,
      });
      onOpenChange(false);
      toast.success("Event saved.");
      return;
    }

    setPending(true);
    try {
      if (isEditing && event) {
        const result = await actions.update({
          id: event.id,
          title: trimmedTitle,
          description: nextDescription,
          startAt: range.startAt,
          endAt: range.endAt,
          allDay: effectiveAllDay,
          color,
          ...(isRehab ? { recurrence } : {}),
        });
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        onSaved({
          ...event,
          title: trimmedTitle,
          description: nextDescription,
          startAt: range.startAt,
          endAt: range.endAt,
          allDay: effectiveAllDay,
          color,
          updatedAt: new Date().toISOString(),
        });
        toast.success("Event updated.");
      } else {
        const result = await actions.create({
          title: trimmedTitle,
          description: nextDescription,
          startAt: range.startAt,
          endAt: range.endAt,
          allDay: effectiveAllDay,
          color,
          ...(isRehab ? { recurrence } : {}),
        });
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        const now = new Date().toISOString();
        onSaved({
          id: result.id,
          userId: "server",
          title: trimmedTitle,
          description: nextDescription,
          startAt: range.startAt,
          endAt: range.endAt,
          allDay: effectiveAllDay,
          color,
          createdAt: now,
          updatedAt: now,
        });
        toast.success("Event created.");
      }
      onOpenChange(false);
    } finally {
      setPending(false);
    }
  }

  async function performSeriesEdit(scope: SeriesEditScope) {
    if (!rehabEvent) {
      return;
    }
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error("Title is required.");
      return;
    }
    const range = buildIsoRange();
    if (!range) {
      return;
    }
    setEditScopePrompt(false);
    setPending(true);
    try {
      const result = await editSeries(
        rehabEvent as RehabPlanEvent,
        {
          title: trimmedTitle,
          description: storedDescription(),
          startAt: range.startAt,
          endAt: range.endAt,
          allDay: effectiveAllDay,
          color,
        },
        recurrence,
        scope,
      );
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      onOpenChange(false);
      toast.success("Event updated.");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!event) {
      return;
    }

    // Recurring occurrence: choose single occurrence vs whole series.
    if (isSeriesOccurrence) {
      setDeleteScopePrompt(true);
      return;
    }

    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    if (!persistence) {
      onDeleted(event.id);
      onOpenChange(false);
      toast.success("Event deleted.");
      return;
    }

    setPending(true);
    try {
      const result = await actions.delete(event.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      onDeleted(event.id);
      onOpenChange(false);
      toast.success("Event deleted.");
    } finally {
      setPending(false);
    }
  }

  async function performDelete(mode: "occurrence" | "series") {
    if (!event || !rehabEvent) {
      return;
    }
    setDeleteScopePrompt(false);
    setPending(true);
    try {
      const result = await deleteOccurrence(rehabEvent as RehabPlanEvent, mode);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      onDeleted(event.id);
      onOpenChange(false);
      toast.success(mode === "series" ? "Series deleted." : "Event deleted.");
    } finally {
      setPending(false);
    }
  }

  async function handleClose() {
    if (pending) {
      return;
    }
    if (
      viewOnly ||
      (isEditing && !hasChanges) ||
      (!isEditing && title.trim().length === 0)
    ) {
      onOpenChange(false);
      return;
    }
    await handleSubmit();
  }

  closeRequestRef.current = handleClose;

  return (
    <DialogContent
      showCloseButton={false}
      className="grid max-h-[min(90vh,42rem)] min-h-[32rem] overflow-hidden border-white/10 bg-[#1f1f1f] p-0 text-white shadow-2xl sm:max-w-[48rem] md:grid-cols-[minmax(0,1fr)_15rem] md:items-stretch"
    >
      <DialogTitle className="sr-only">
        {viewOnly ? "Event details" : isEditing ? "Edit event" : "New event"}
      </DialogTitle>
      <DialogDescription className="sr-only">
        {viewOnly
          ? "This calendar is view-only."
          : isEditing
            ? "Update this task."
            : "Create a new task."}
      </DialogDescription>

      <section className="order-2 flex min-h-0 flex-col px-5 py-5 md:order-1 md:px-6">
        <div className="mb-4 flex shrink-0 items-center justify-between">
          <button
            type="button"
            onClick={() => void handleClose()}
            className="text-white/45 transition-colors hover:text-white"
            aria-label="Close"
          >
            <X className="size-4" aria-hidden />
          </button>

          {isEditing && !viewOnly ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              className={cn(
                "rounded-md p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white",
                confirmDelete && "bg-destructive/20 text-destructive",
              )}
              aria-label={confirmDelete ? "Confirm delete" : "Delete event"}
              title={confirmDelete ? "Confirm delete" : "Delete"}
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          ) : null}
        </div>

        <div className="flex min-h-0 flex-1 gap-3">
          <Checkbox
            checked={Boolean(
              event && "completedAt" in event && event.completedAt,
            )}
            disabled
            className="mt-0.5 shrink-0 border-white/25"
            aria-label="Completion"
          />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task name"
              autoFocus={!viewOnly}
              readOnly={viewOnly}
              disabled={viewOnly}
              className="w-full shrink-0 bg-transparent text-base font-semibold text-white outline-none placeholder:text-white/40 disabled:opacity-60"
            />
            <textarea
              id="event-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              readOnly={viewOnly}
              disabled={viewOnly}
              className="mt-3 min-h-0 flex-1 resize-none overflow-y-auto bg-transparent text-sm leading-relaxed text-white/55 outline-none placeholder:text-white/30 disabled:opacity-60"
            />
            <EventSubtasksEditor
              subtasks={subtasks}
              onChange={setSubtasks}
              disabled={viewOnly}
            />
          </div>
        </div>

        {pending ? (
          <p className="mt-3 shrink-0 text-right text-xs text-white/35">
            Saving…
          </p>
        ) : null}
      </section>

      <aside className="order-1 flex shrink-0 flex-col gap-1 border-b border-white/8 bg-[#161616] px-3 py-4 md:order-2 md:border-b-0 md:border-l md:border-l-white/8">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <DateField
              date={startDate}
              onChange={updateStartDate}
              disabled={viewOnly}
            />
            {showTime ? (
              <TimeField
                time={startTime}
                onChange={updateStartTime}
                onClear={() => setShowTime(false)}
                disabled={viewOnly}
              />
            ) : null}
          </div>
          {isRehab ? (
            <RehabRepeatField
              value={recurrence}
              startDate={startDate}
              onChange={setRecurrence}
              disabled={viewOnly}
              appearance="sidebar"
            />
          ) : (
            <button
              type="button"
              className="self-start rounded-md p-1.5 text-white/35 transition-colors hover:bg-white/8 hover:text-white/70"
              aria-label="Repeat"
              disabled
            >
              <RotateCcw className="size-4" aria-hidden />
            </button>
          )}
        </div>
        {isRehab && recurrence ? (
          <p className="px-1.5 pt-1 text-xs text-white/45">
            {describeRecurrence(recurrence)}
          </p>
        ) : null}
      </aside>

      {editScopePrompt ? (
        <ScopePrompt
          title="Edit recurring event"
          options={[
            { id: "occurrence", label: "This event" },
            { id: "following", label: "This and following events" },
            { id: "all", label: "All events" },
          ]}
          onSelect={(id) => void performSeriesEdit(id as SeriesEditScope)}
          onCancel={() => setEditScopePrompt(false)}
        />
      ) : null}

      {deleteScopePrompt ? (
        <ScopePrompt
          title="Delete recurring event"
          options={[
            { id: "occurrence", label: "This event" },
            { id: "series", label: "All events in series" },
          ]}
          onSelect={(id) => void performDelete(id as "occurrence" | "series")}
          onCancel={() => setDeleteScopePrompt(false)}
        />
      ) : null}
    </DialogContent>
  );
}

function ScopePrompt({
  title,
  options,
  onSelect,
  onCancel,
}: {
  title: string;
  options: { id: string; label: string }[];
  onSelect: (id: string) => void;
  onCancel: () => void;
}) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 p-6">
      <div className="w-full max-w-xs rounded-xl border border-white/10 bg-[#1c1c1c] p-4 shadow-2xl">
        <h3 className="mb-3 text-sm font-semibold text-white">{title}</h3>
        <div className="space-y-1.5">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-white/80 transition-colors hover:bg-white/8"
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-1.5 text-sm text-white/55 transition-colors hover:bg-white/8 hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

const POPOVER_BG = "bg-[#1c1c1c] border-white/10 text-white shadow-2xl";

function EventSubtasksEditor({
  subtasks,
  onChange,
  disabled = false,
}: {
  subtasks: EventSubtask[];
  onChange: (subtasks: EventSubtask[]) => void;
  disabled?: boolean;
}) {
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const nextIdRef = useRef(0);

  function updateSubtask(id: string, patch: Partial<EventSubtask>) {
    onChange(
      subtasks.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function removeSubtask(id: string) {
    onChange(subtasks.filter((item) => item.id !== id));
  }

  function addSubtask() {
    nextIdRef.current += 1;
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `subtask-${nextIdRef.current}`;
    onChange([...subtasks, { id, label: "", done: false }]);
    requestAnimationFrame(() => {
      inputRefs.current.get(id)?.focus();
    });
  }

  return (
    <div className="mt-4 shrink-0 space-y-2 border-t border-white/8 pt-4">
      {subtasks.map((subtask) => (
        <div key={subtask.id} className="group flex items-center gap-2.5">
          <Checkbox
            checked={subtask.done}
            onCheckedChange={(value) =>
              updateSubtask(subtask.id, { done: Boolean(value) })
            }
            disabled={disabled}
            className="shrink-0 border-white/25"
            aria-label={`Mark subtask ${subtask.label || "complete"}`}
          />
          <input
            ref={(node) => {
              if (node) {
                inputRefs.current.set(subtask.id, node);
              } else {
                inputRefs.current.delete(subtask.id);
              }
            }}
            value={subtask.label}
            onChange={(event) =>
              updateSubtask(subtask.id, { label: event.target.value })
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addSubtask();
              }
              if (event.key === "Backspace" && subtask.label.length === 0) {
                event.preventDefault();
                removeSubtask(subtask.id);
              }
            }}
            placeholder="Subtask"
            readOnly={disabled}
            disabled={disabled}
            className={cn(
              "min-w-0 flex-1 bg-transparent text-sm text-white/70 outline-none placeholder:text-white/30 disabled:opacity-60",
              subtask.done && "text-white/35 line-through",
            )}
          />
          {subtask.referenceUrl ? (
            <a
              href={subtask.referenceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-white/10 px-1.5 py-0.5 text-[11px] font-medium text-white/45 transition-colors hover:border-white/20 hover:bg-white/8 hover:text-white/75"
              aria-label={`Open reference for ${subtask.label || "exercise"}`}
            >
              {subtask.referenceLabel ?? "Ref"}
              <ExternalLink className="size-3" aria-hidden />
            </a>
          ) : null}
          {!disabled ? (
            <button
              type="button"
              onClick={() => removeSubtask(subtask.id)}
              className="shrink-0 rounded-md p-1 text-white/35 opacity-0 transition-opacity hover:text-white group-hover:opacity-100 focus:opacity-100"
              aria-label={`Remove subtask ${subtask.label || ""}`}
            >
              <X className="size-3.5" aria-hidden />
            </button>
          ) : null}
        </div>
      ))}

      {!disabled ? (
        <button
          type="button"
          onClick={addSubtask}
          className="flex w-full items-center gap-2.5 text-sm text-white/30 transition-colors hover:text-white/50"
        >
          <span className="size-3 shrink-0 rounded-sm border border-dashed border-white/20" />
          Subtask
        </button>
      ) : null}
    </div>
  );
}

function DateField({
  date,
  onChange,
  disabled = false,
}: {
  date: Date;
  onChange: (date: Date) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [inputVal, setInputVal] = useState(format(date, "dd-MM-yyyy"));
  const today = startOfDay(new Date());
  const quickDates = [
    { label: "Today", date: today },
    { label: "Tomorrow", date: addDays(today, 1) },
    { label: "Next week", date: addDays(today, 7) },
  ];

  function commitInput() {
    const parts = inputVal.split("-");
    if (parts.length === 3) {
      const parsed = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      if (!isNaN(parsed.getTime())) {
        onChange(parsed);
        return;
      }
    }
    setInputVal(format(date, "dd-MM-yyyy"));
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (!disabled) setOpen(next);
      }}
    >
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            className="h-7 w-full justify-start gap-2.5 rounded-md px-1.5 text-sm font-medium text-white/85 hover:bg-white/8 hover:text-white"
            disabled={disabled}
          />
        }
      >
        <CalendarIcon className="size-3.5 shrink-0 text-white/50" />
        {format(date, "EEE d MMM")}
      </PopoverTrigger>
      <PopoverContent
        className={cn("w-64 overflow-hidden p-0", POPOVER_BG)}
        align="start"
      >
        {/* Editable date input */}
        <div className="p-2">
          <div className="flex items-center gap-2 rounded-lg bg-white/8 px-3 py-2 text-sm">
            <CalendarIcon className="size-3.5 shrink-0 text-white/50" />
            <input
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onBlur={commitInput}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitInput();
              }}
              className="flex-1 bg-transparent outline-none"
            />
          </div>
        </div>

        {/* Quick picks */}
        <div className="border-y border-white/8 py-0.5">
          {quickDates.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                onChange(item.date);
                setInputVal(format(item.date, "dd-MM-yyyy"));
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-white/8"
            >
              <CalendarIcon className="size-3.5 shrink-0 text-white/45" />
              <span className="flex-1">{item.label}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-white/50 hover:bg-white/8"
          >
            <CalendarIcon className="size-3.5 shrink-0 text-white/30" />
            <span className="flex-1">No date</span>
          </button>
        </div>

        {/* Mini calendar — Monday-first */}
        <Calendar
          mode="single"
          selected={date}
          weekStartsOn={1}
          onSelect={(next: Date | undefined) => {
            if (next) {
              onChange(next);
              setInputVal(format(next, "dd-MM-yyyy"));
              setOpen(false);
            }
          }}
          classNames={{
            months: "flex flex-col",
            month: "flex flex-col gap-1",
            month_caption: "flex items-center justify-between px-1 py-2",
            caption_label: "text-xs font-semibold text-white/80",
            nav: "flex items-center gap-0.5",
            button_previous:
              "size-6 rounded flex items-center justify-center text-white/40 hover:bg-white/8 hover:text-white/80",
            button_next:
              "size-6 rounded flex items-center justify-center text-white/40 hover:bg-white/8 hover:text-white/80",
            month_grid: "w-full border-collapse px-1 pb-2",
            weekdays: "flex mb-1",
            weekday: "w-8 text-center text-[11px] text-white/35 font-normal",
            week: "flex",
            day: "p-0 text-center",
            day_button:
              "size-8 rounded text-xs font-normal text-white/75 hover:bg-white/10 aria-selected:opacity-100",
            selected:
              "bg-white text-black rounded hover:bg-white focus:bg-white",
            today: "text-white font-semibold",
            outside: "text-white/20",
            disabled: "text-white/20 pointer-events-none",
            hidden: "invisible",
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function TimeField({
  time,
  onChange,
  onClear,
  disabled = false,
}: {
  time: string;
  onChange: (time: string) => void;
  onClear?: () => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const quickTimes = ["09:00", "12:00", "15:00", "18:00", "21:00"];

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (!disabled) setOpen(next);
      }}
    >
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            className="h-7 w-full justify-start gap-2.5 rounded-md px-1.5 text-sm font-normal text-white/60 hover:bg-white/8 hover:text-white/80"
            disabled={disabled}
          />
        }
      >
        <Clock3 className="size-3.5 shrink-0 text-white/40" />
        {time}
      </PopoverTrigger>
      <PopoverContent
        className={cn("w-52 overflow-hidden p-0", POPOVER_BG)}
        align="start"
      >
        {/* Editable time input */}
        <div className="p-2">
          <div className="flex items-center gap-2 rounded-lg bg-white/8 px-3 py-2 text-sm">
            <Clock3 className="size-3.5 shrink-0 text-white/50" />
            <input
              type="text"
              value={time}
              placeholder="HH:MM"
              onChange={(e) => {
                const val = e.target.value;
                onChange(val);
              }}
              onBlur={(e) => {
                const val = e.target.value;
                if (/^\d{1,2}:\d{2}$/.test(val)) {
                  const [h, m] = val.split(":");
                  onChange(`${h.padStart(2, "0")}:${m}`);
                } else {
                  onChange(time);
                }
              }}
              className="flex-1 bg-transparent outline-none"
            />
          </div>
        </div>

        {/* Quick times */}
        <div className="border-y border-white/8 py-0.5">
          {quickTimes.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                onChange(item);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-white/8",
                item === time && "bg-white/10",
              )}
            >
              <Clock3 className="size-3.5 shrink-0 text-white/45" />
              {item}
            </button>
          ))}
        </div>

        {/* Remove time */}
        {onClear ? (
          <button
            type="button"
            onClick={() => {
              onClear();
              setOpen(false);
            }}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-red-400 hover:bg-white/8"
          >
            <BellOff className="size-3.5 shrink-0" />
            Remove start time
          </button>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
