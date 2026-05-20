"use client";

import { format } from "date-fns";
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
import {
  combineDateAndTime,
  defaultEventEnd,
  eventColorClasses,
  toDateInputValue,
  toTimeInputValue,
} from "@/lib/calendar/calendar-utils";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  updateCalendarEvent,
} from "@/lib/calendar/calendar-actions";
import { cn } from "@/lib/utils";
import type { CalendarEvent, CalendarEventColor } from "@/types/calendar";
import { CALENDAR_EVENT_COLORS } from "@/types/calendar";

type EventFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
  defaultStart: Date;
  persistence: boolean;
  onSaved: (event: CalendarEvent) => void;
  onDeleted: (id: string) => void;
};

export function EventFormDialog({
  open,
  onOpenChange,
  event,
  defaultStart,
  persistence,
  onSaved,
  onDeleted,
}: EventFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <EventFormDialogBody
          key={event?.id ?? defaultStart.toISOString()}
          event={event}
          defaultStart={defaultStart}
          persistence={persistence}
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
  onOpenChange,
  onSaved,
  onDeleted,
}: Omit<EventFormDialogProps, "open">) {
  const isEditing = event !== null;
  const initialStart = event ? new Date(event.startAt) : defaultStart;
  const initialEnd = event ? new Date(event.endAt) : defaultEventEnd(defaultStart);

  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [allDay, setAllDay] = useState(event?.allDay ?? false);
  const [color, setColor] = useState<CalendarEventColor>(event?.color ?? "blue");
  const [startDate, setStartDate] = useState(initialStart);
  const [endDate, setEndDate] = useState(initialEnd);
  const [startTime, setStartTime] = useState(toTimeInputValue(initialStart));
  const [endTime, setEndTime] = useState(toTimeInputValue(initialEnd));
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function buildIsoRange(): { startAt: string; endAt: string } | null {
    if (allDay) {
      const start = combineDateAndTime(toDateInputValue(startDate), "00:00");
      const end = combineDateAndTime(toDateInputValue(endDate), "23:59");
      if (end < start) {
        toast.error("End date must be on or after start date.");
        return null;
      }
      return { startAt: start.toISOString(), endAt: end.toISOString() };
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
      toast.message("Event saved locally (Supabase not syncing).");
      return;
    }

    setPending(true);
    try {
      if (isEditing && event) {
        const result = await updateCalendarEvent({
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
        const result = await createCalendarEvent({
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
      toast.message("Event removed locally.");
      return;
    }

    setPending(true);
    try {
      const result = await deleteCalendarEvent(event.id);
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
        <DialogTitle>{isEditing ? "Edit event" : "New event"}</DialogTitle>
        <DialogDescription>
          {isEditing
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
            autoFocus
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
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={allDay} onCheckedChange={(v) => setAllDay(Boolean(v))} />
          All day
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <DateField label="Start date" date={startDate} onChange={setStartDate} />
          <DateField label="End date" date={endDate} onChange={setEndDate} />
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">End time</Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
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
                className={cn(
                  "rounded-md border px-3 py-1.5 text-xs capitalize transition-opacity",
                  eventColorClasses(item),
                  color === item ? "ring-2 ring-ring" : "opacity-70 hover:opacity-100",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <DialogFooter className="gap-2 sm:justify-between">
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
      </DialogFooter>
    </DialogContent>
  );
}

function DateField({
  label,
  date,
  onChange,
}: {
  label: string;
  date: Date;
  onChange: (date: Date) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              className="w-full justify-start font-normal"
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
            onSelect={(next) => {
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
