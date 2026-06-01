"use client";

import { addDays, format, startOfDay } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { allDayInclusiveEndForForm, calendarDateToStorage } from "@/lib/calendar/all-day-events";
import {
  combineDateAndTime,
  defaultEventEnd,
  eventColorClasses,
  toDateInputValue,
  toTimeInputValue,
} from "@/lib/calendar/calendar-utils";
import {
  calendarEventActionsFor,
  type CalendarClientVariant,
} from "@/lib/calendar/calendar-event-actions";
import { cn } from "@/lib/utils";
import type { CalendarEvent, CalendarEventColor } from "@/types/calendar";
import { CALENDAR_EVENT_COLORS } from "@/types/calendar";

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <EventFormDialogBody
          key={
            event?.id ??
            `${defaultStart.toISOString()}:${defaultAllDay ? "1" : "0"}`
          }
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
  event,
  defaultStart,
  persistence,
  readOnly = false,
  variant = "family",
  defaultAllDay = false,
  onOpenChange,
  onSaved,
  onDeleted,
}: Omit<EventFormDialogProps, "open">) {
  const actions = calendarEventActionsFor(variant);
  const isEditing = event !== null;
  const viewOnly = readOnly;
  const initialStart = event ? new Date(event.startAt) : defaultStart;
  const initialEnd = event
    ? event.allDay
      ? allDayInclusiveEndForForm(event)
      : new Date(event.endAt)
    : defaultEventEnd(defaultStart);

  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [allDay, setAllDay] = useState(event?.allDay ?? defaultAllDay);
  const [color, setColor] = useState<CalendarEventColor>(event?.color ?? "blue");
  const [startDate, setStartDate] = useState(initialStart);
  const [endDate, setEndDate] = useState(initialEnd);
  const [startTime, setStartTime] = useState(toTimeInputValue(initialStart));
  const [endTime, setEndTime] = useState(toTimeInputValue(initialEnd));
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function buildIsoRange(): { startAt: string; endAt: string } | null {
    if (allDay) {
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

    const start = combineDateAndTime(
      toDateInputValue(startDate),
      startTime,
    );
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

    if (!persistence) {
      const now = new Date().toISOString();
      onSaved({
        id: event?.id ?? crypto.randomUUID(),
        userId: event?.userId ?? "local",
        title: trimmedTitle,
        description: description.trim() || null,
        startAt: range.startAt,
        endAt: range.endAt,
        allDay,
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
          description: description.trim() || null,
          startAt: range.startAt,
          endAt: range.endAt,
          allDay,
          color,
        });
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        onSaved({
          ...event,
          title: trimmedTitle,
          description: description.trim() || null,
          startAt: range.startAt,
          endAt: range.endAt,
          allDay,
          color,
          updatedAt: new Date().toISOString(),
        });
        toast.success("Event updated.");
      } else {
        const result = await actions.create({
          title: trimmedTitle,
          description: description.trim() || null,
          startAt: range.startAt,
          endAt: range.endAt,
          allDay,
          color,
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
          description: description.trim() || null,
          startAt: range.startAt,
          endAt: range.endAt,
          allDay,
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

  async function handleDelete() {
    if (!event) {
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

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
      <DialogHeader>
        <DialogTitle>
          {viewOnly ? "Event details" : isEditing ? "Edit event" : "New event"}
        </DialogTitle>
        <DialogDescription>
          {viewOnly
            ? "This calendar is view-only."
            : isEditing
              ? "Update the details below or delete this event."
              : "Add a title, time, and optional notes."}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="event-title">Title</Label>
          <Input
            id="event-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Team meeting"
            autoFocus={!viewOnly}
            readOnly={viewOnly}
            disabled={viewOnly}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="event-description">Description</Label>
          <Textarea
            id="event-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional details"
            rows={3}
            readOnly={viewOnly}
            disabled={viewOnly}
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={allDay}
            onCheckedChange={(v) => setAllDay(Boolean(v))}
            disabled={viewOnly}
          />
          All day
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <DateField
            label="Start date"
            date={startDate}
            onChange={setStartDate}
            disabled={viewOnly}
          />
          <DateField
            label="End date"
            date={endDate}
            onChange={setEndDate}
            disabled={viewOnly}
          />
        </div>

        {!allDay ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start time</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                readOnly={viewOnly}
                disabled={viewOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">End time</Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                readOnly={viewOnly}
                disabled={viewOnly}
              />
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label>Color</Label>
          <div className="flex flex-wrap gap-2">
            {CALENDAR_EVENT_COLORS.map((item) => (
              <button
                key={item}
                type="button"
                aria-label={`Color ${item}`}
                onClick={() => setColor(item)}
                disabled={viewOnly}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-xs capitalize transition-opacity",
                  eventColorClasses(item),
                  color === item ? "ring-2 ring-ring" : "opacity-70 hover:opacity-100",
                  viewOnly && "pointer-events-none",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <DialogFooter className="gap-2 sm:justify-between">
        {viewOnly ? (
          <Button type="button" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        ) : (
          <>
            {isEditing ? (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={pending}
              >
                {confirmDelete ? "Confirm delete" : "Delete"}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={pending}>
                {pending ? "Saving…" : isEditing ? "Save changes" : "Create event"}
              </Button>
            </div>
          </>
        )}
      </DialogFooter>
    </DialogContent>
  );
}

function DateField({
  label,
  date,
  onChange,
  disabled = false,
}: {
  label: string;
  date: Date;
  onChange: (date: Date) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              className="w-full justify-start font-normal"
              disabled={disabled}
            />
          }
        >
          <CalendarIcon className="opacity-70" />
          {format(date, "PPP")}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(next: Date | undefined) => {
              if (next) {
                onChange(next);
                setOpen(false);
              }
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
