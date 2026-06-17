"use client";

import { addDays, addMilliseconds, format, startOfDay } from "date-fns";
import {
  CalendarIcon,
  Clock3,
  ExternalLink,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RehabTimePicker } from "@/components/rehab/rehab-time-picker";
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
import {
  rehabEventKindDefaultColor,
  rehabEventKindPickerVisual,
} from "@/lib/rehab/rehab-event-kind-visual";
import { RehabRepeatField } from "@/components/rehab/rehab-repeat-field";
import { RehabEventKindPicker } from "@/components/rehab/rehab-event-kind-picker";
import { RehabRecurringIcon } from "@/components/rehab/rehab-recurring-icon";
import { RehabSpeechRecordingSection } from "@/components/rehab/rehab-speech-recording-section";
import { allEventSubtasksDone } from "@/modules/rehab/neuro-rehab-2026/day0-checklist";
import {
  useRehabPlanStore,
  type SeriesEditScope,
} from "@/stores/rehab-plan-store";
import { cn } from "@/lib/utils";
import type { CalendarEvent, CalendarEventColor } from "@/types/calendar";
import type { RehabPlanEvent, RehabEventKind } from "@/types/rehab";

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


export type EventFormLayout = "dialog" | "page";

export function EventFormPage({
  event,
  defaultStart,
  persistence,
  readOnly = false,
  variant = "rehab",
  defaultAllDay = false,
  onSaved,
  onDeleted,
  onClose,
}: Omit<EventFormDialogProps, "open" | "onOpenChange"> & {
  onClose: () => void;
}) {
  const closeRequestRef = useRef<(() => void | Promise<void>) | null>(null);

  return (
    <EventFormDialogBody
      key={
        event?.id ??
        `${defaultStart.toISOString()}:${defaultAllDay ? "1" : "0"}`
      }
      layout="page"
      closeRequestRef={closeRequestRef}
      event={event}
      defaultStart={defaultStart}
      persistence={persistence}
      readOnly={readOnly}
      variant={variant}
      defaultAllDay={defaultAllDay}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      onSaved={onSaved}
      onDeleted={onDeleted}
    />
  );
}

function EventFormDialogBody({
  layout = "dialog",
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
  layout?: EventFormLayout;
  closeRequestRef: React.MutableRefObject<(() => void | Promise<void>) | null>;
}) {
  const actions = calendarEventActionsFor(variant);
  const editSeries = useRehabPlanStore((s) => s.editSeries);
  const deleteOccurrence = useRehabPlanStore((s) => s.deleteOccurrence);
  const toggleOccurrenceCompleted = useRehabPlanStore(
    (s) => s.toggleOccurrenceCompleted,
  );
  const isEditing = event !== null;
  const viewOnly = readOnly;
  const isRehab = variant === "rehab";
  const rehabEvent = event as (CalendarEvent & Partial<RehabPlanEvent>) | null;
  /** Editing an existing occurrence of a recurring series. */
  const isSeriesOccurrence =
    isRehab && isEditing && Boolean(rehabEvent?.recurrenceAt);
  /** Speech practice events get a voice-recording control inside the modal. */
  const initialEventKind: RehabEventKind = isRehab
    ? (rehabEvent?.eventKind ?? "custom")
    : "custom";
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
  const [myNotes, setMyNotes] = useState(initialParsed.myNotes);
  const [subtasks, setSubtasks] = useState<EventSubtask[]>(
    initialParsed.subtasks,
  );
  const allDay = event?.allDay ?? defaultAllDay;
  const [color, setColor] = useState<CalendarEventColor>(
    event?.color ?? rehabEventKindDefaultColor(initialEventKind),
  );
  const [eventKind, setEventKind] = useState<RehabEventKind>(initialEventKind);
  const isSpeechEvent = isRehab && isEditing && eventKind === "speech";
  const [startDate, setStartDate] = useState(initialStart);
  const [endDate, setEndDate] = useState(initialEnd);
  const [startTime, setStartTime] = useState(toTimeInputValue(initialStart));
  const [endTime, setEndTime] = useState(toTimeInputValue(initialEnd));
  const [showTime, setShowTime] = useState(!allDay);
  const [pending, setPending] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [completedOverride, setCompletedOverride] = useState<boolean | null>(
    null,
  );
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
  const hasSubtasks = subtasks.length > 0;
  const isCompleted = hasSubtasks
    ? allEventSubtasksDone(subtasks)
    : (completedOverride ?? Boolean(rehabEvent?.completedAt));
  const hasChanges =
    title !== (event?.title ?? "") ||
    description !== initialParsed.description ||
    myNotes !== initialParsed.myNotes ||
    !subtasksEqual(subtasks, initialParsed.subtasks) ||
    effectiveAllDay !== (event?.allDay ?? defaultAllDay) ||
    color !== (event?.color ?? rehabEventKindDefaultColor(initialEventKind)) ||
    eventKind !== initialEventKind ||
    toDateInputValue(startDate) !== toDateInputValue(initialStart) ||
    startTime !== toTimeInputValue(initialStart) ||
    recurrenceChanged;

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
  }

  useEffect(() => {
    setCompletedOverride(null);
  }, [event?.id]);

  function storedDescription(): string | null {
    return serializeEventDescription(
      description,
      subtasks,
      isRehab ? myNotes : "",
    );
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
      const base = {
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
      };
      onSaved(
        (isRehab
          ? {
              ...base,
              completedAt: rehabEvent?.completedAt ?? null,
              eventKind,
              programId: rehabEvent?.programId ?? null,
              planWeek: rehabEvent?.planWeek ?? null,
              speechRecordings: rehabEvent?.speechRecordings ?? [],
              seriesId: rehabEvent?.seriesId ?? null,
              recurrence: isRehab ? recurrence : null,
              recurrenceAt: rehabEvent?.recurrenceAt ?? null,
              recurrenceCancelled: rehabEvent?.recurrenceCancelled ?? false,
            }
          : base) as CalendarEvent,
      );
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
          ...(isRehab ? { recurrence, eventKind } : {}),
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
          ...(isRehab ? { eventKind } : {}),
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
          ...(isRehab ? { recurrence, eventKind } : {}),
        });
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        const now = new Date().toISOString();
        onSaved(
          (isRehab
            ? {
                id: result.id,
                userId: "server",
                title: trimmedTitle,
                description: nextDescription,
                startAt: range.startAt,
                endAt: range.endAt,
                allDay: effectiveAllDay,
                color,
                completedAt: null,
                eventKind,
                programId: null,
                planWeek: null,
                speechRecordings: [],
                seriesId: recurrence ? result.id : null,
                recurrence,
                recurrenceAt: null,
                recurrenceCancelled: false,
                createdAt: now,
                updatedAt: now,
              }
            : {
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
              }) as CalendarEvent,
        );
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
          eventKind,
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

  function requestDelete() {
    if (!event) {
      return;
    }

    // Recurring occurrence: choose single occurrence vs whole series.
    if (isSeriesOccurrence) {
      setDeleteScopePrompt(true);
      return;
    }

    setDeleteConfirmOpen(true);
  }

  async function confirmDeleteTask() {
    if (!event) {
      return;
    }

    if (!persistence) {
      if (isRehab && rehabEvent) {
        await deleteOccurrence(rehabEvent as RehabPlanEvent, "occurrence");
      }
      onDeleted(event.id);
      setDeleteConfirmOpen(false);
      onOpenChange(false);
      toast.success("Event deleted.");
      return;
    }

    setPending(true);
    try {
      const result =
        isRehab && rehabEvent
          ? await deleteOccurrence(rehabEvent as RehabPlanEvent, "occurrence")
          : await actions.delete(event.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      onDeleted(event.id);
      setDeleteConfirmOpen(false);
      onOpenChange(false);
      toast.success("Event deleted.");
    } finally {
      setPending(false);
    }
  }

  async function handleToggleCompleted(checked: boolean) {
    if (!isRehab || viewOnly || !event || !rehabEvent) {
      return;
    }

    if (hasSubtasks) {
      const nextSubtasks = subtasks.map((item) => ({ ...item, done: checked }));
      const nextDescription = serializeEventDescription(
        description,
        nextSubtasks,
        myNotes,
      );

      if (!persistence) {
        setSubtasks(nextSubtasks);
        return;
      }

      setPending(true);
      try {
        const result = await actions.update({
          id: event.id,
          description: nextDescription,
        });
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        setSubtasks(nextSubtasks);
        const currentlyCompleted = Boolean(rehabEvent.completedAt);
        if (checked !== currentlyCompleted) {
          const toggleResult = await toggleOccurrenceCompleted(
            rehabEvent as RehabPlanEvent,
            checked,
          );
          if (!toggleResult.ok) {
            toast.error(toggleResult.message);
            return;
          }
        }
        setCompletedOverride(checked);
      } finally {
        setPending(false);
      }
      return;
    }

    if (!persistence) {
      if (hasSubtasks) {
        setSubtasks(subtasks.map((item) => ({ ...item, done: checked })));
      } else {
        setCompletedOverride(checked);
      }
      return;
    }

    setPending(true);
    try {
      const result = await toggleOccurrenceCompleted(
        rehabEvent as RehabPlanEvent,
        checked,
      );
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setCompletedOverride(checked);
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
    const eventId = event.id;
    const deletePromise = deleteOccurrence(rehabEvent as RehabPlanEvent, mode);
    // deleteOccurrence applies the optimistic store update before its first await.
    setPending(false);
    onDeleted(eventId);
    onOpenChange(false);

    try {
      const result = await deletePromise;
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(mode === "series" ? "Series deleted." : "Event deleted.");
    } catch {
      toast.error("Could not delete event.");
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

  const isPage = layout === "page";
  const shellClassName = cn(
    "grid w-full overflow-x-hidden border-white/10 bg-[#1f1f1f] p-0 text-white",
    isPage
      ? "min-h-0 flex-1 overflow-y-auto md:grid-cols-[minmax(0,1fr)_15rem] md:items-stretch"
      : "max-h-[min(90vh,42rem)] min-h-[32rem] overflow-hidden shadow-2xl sm:max-w-[48rem] md:grid-cols-[minmax(0,1fr)_15rem] md:items-stretch",
  );
  const titleText = viewOnly
    ? "Event details"
    : isEditing
      ? "Edit event"
      : "New event";
  const descriptionText = viewOnly
    ? "This calendar is view-only."
    : isEditing
      ? "Update this task."
      : "Create a new task.";

  const formBody = (
    <>
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
              onClick={requestDelete}
              disabled={pending}
              className="rounded-md p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Delete event"
              title="Delete"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          ) : null}
        </div>

        <div className="flex min-h-0 flex-1 gap-3">
          <Checkbox
            checked={isCompleted}
            onCheckedChange={(value) =>
              void handleToggleCompleted(Boolean(value))
            }
            disabled={viewOnly || pending || !isEditing || !isRehab}
            className="mt-0.5 shrink-0 cursor-pointer border-white/25"
            aria-label={
              isCompleted ? "Mark task incomplete" : "Mark task complete"
            }
          />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
            <div className="flex shrink-0 items-center gap-2">
              <input
                id="event-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task name"
                autoFocus={!viewOnly && !isPage}
                readOnly={viewOnly}
                disabled={viewOnly}
                className="min-w-0 flex-1 bg-transparent text-base font-semibold text-white outline-none placeholder:text-white/40 disabled:opacity-60"
              />
              {isRehab && (recurrence || isSeriesOccurrence) ? (
                <RehabRecurringIcon
                  event={{
                    recurrence,
                    seriesId: rehabEvent?.seriesId,
                    recurrenceAt: rehabEvent?.recurrenceAt,
                  }}
                  size="md"
                  variant="inverse"
                />
              ) : null}
            </div>
            <textarea
              id="event-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              readOnly={viewOnly}
              disabled={viewOnly}
              className={cn("mt-3 min-h-0 flex-1 resize-none overflow-y-auto bg-transparent leading-relaxed text-white/55 outline-none placeholder:text-white/30 disabled:opacity-60", isPage ? "text-base" : "text-sm")}
            />
            <EventSubtasksEditor
              subtasks={subtasks}
              onChange={setSubtasks}
              disabled={viewOnly}
            />
            {isSpeechEvent && event ? (
              <RehabSpeechRecordingSection
                eventId={event.id}
                eventStartAt={event.startAt}
                persistence={persistence}
                readOnly={viewOnly}
              />
            ) : null}
            {isRehab ? (
              <div className="mt-4 shrink-0 space-y-1.5">
                <label
                  htmlFor="event-my-notes"
                  className="text-xs font-medium text-white/50"
                >
                  My Notes
                </label>
                <textarea
                  id="event-my-notes"
                  value={myNotes}
                  onChange={(e) => setMyNotes(e.target.value)}
                  placeholder="How did this session feel? Anything to remember for next time…"
                  readOnly={viewOnly}
                  disabled={viewOnly}
                  rows={4}
                  className={cn("w-full resize-y rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 leading-relaxed text-white/80 outline-none placeholder:text-white/30 focus-visible:border-white/25 disabled:opacity-60", isPage ? "text-base" : "text-sm")}
                />
              </div>
            ) : null}
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
        {isRehab ? (
          <RehabEventKindPicker
            value={eventKind}
            onChange={handleEventKindChange}
            disabled={viewOnly}
            appearance="sidebar"
          />
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

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={() => void confirmDeleteTask()}
            >
              {pending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  if (isPage) {
    return (
      <div className={shellClassName}>
        <h1 className="sr-only">{titleText}</h1>
        <p className="sr-only">{descriptionText}</p>
        {formBody}
      </div>
    );
  }

  return (
    <DialogContent showCloseButton={false} className={shellClassName}>
      <DialogTitle className="sr-only">{titleText}</DialogTitle>
      <DialogDescription className="sr-only">{descriptionText}</DialogDescription>
      {formBody}
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

  return (
    <RehabTimePicker
      time={time}
      open={open}
      onOpenChange={(next) => {
        if (!disabled) {
          setOpen(next);
        }
      }}
      onSelect={onChange}
      onClear={onClear}
      trigger={
        <Button
          type="button"
          variant="ghost"
          className="h-7 w-full justify-start gap-2.5 rounded-md px-1.5 text-sm font-normal text-white/60 hover:bg-white/8 hover:text-white/80"
          disabled={disabled}
        >
          <Clock3 className="size-3.5 shrink-0 text-white/40" />
          {time}
        </Button>
      }
    />
  );
}
