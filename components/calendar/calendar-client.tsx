"use client";

import { startOfDay } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { CalendarAgendaView } from "@/components/calendar/calendar-agenda-view";
import { CalendarHeader } from "@/components/calendar/calendar-header";
import { CalendarMonthView } from "@/components/calendar/calendar-month-view";
import {
  CalendarDayView,
  CalendarWeekView,
} from "@/components/calendar/calendar-time-views";
import { EventFormDialog } from "@/components/calendar/event-form-dialog";
import { PageHeader } from "@/components/patterns/page-header";
import { navigateDate } from "@/lib/calendar/calendar-utils";
import { useCalendarStore } from "@/stores/calendar-store";
import type { CalendarEvent, CalendarView } from "@/types/calendar";

const NO_SYNC_TOAST =
  "Events are not syncing. Configure Supabase and run db push before saving.";

export function CalendarClient({
  initialEvents,
  persistence,
}: {
  initialEvents: CalendarEvent[];
  persistence: boolean;
}) {
  const [events, setEvents] = useState(initialEvents);
  const [view, setView] = useState<CalendarView>("month");
  const [currentDate, setCurrentDate] = useState(() => startOfDay(new Date()));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [draftStart, setDraftStart] = useState(() => new Date());

  const sortedEvents = useMemo(
    () =>
      [...events].sort(
        (a, b) =>
          new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      ),
    [events],
  );

  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  useEffect(() => {
    useCalendarStore.getState().setEvents(events);
  }, [events]);

  const openCreate = useCallback(
    (start: Date) => {
      if (!persistence) {
        toast.message(NO_SYNC_TOAST);
      }
      setSelectedEvent(null);
      setDraftStart(start);
      setDialogOpen(true);
    },
    [persistence],
  );

  const openEdit = useCallback(
    (event: CalendarEvent) => {
      setSelectedEvent(event);
      setDraftStart(new Date(event.startAt));
      setDialogOpen(true);
    },
    [],
  );

  const handleNavigate = useCallback(
    (direction: "prev" | "next" | "today") => {
      setCurrentDate((prev) => navigateDate(prev, view, direction));
    },
    [view],
  );

  const handleViewChange = useCallback((nextView: CalendarView) => {
    setView(nextView);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "m") {
        setView("month");
      } else if (key === "w") {
        setView("week");
      } else if (key === "d") {
        setView("day");
      } else if (key === "a") {
        setView("agenda");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function handleSaved(event: CalendarEvent) {
    setEvents((prev) => {
      const exists = prev.some((item) => item.id === event.id);
      if (exists) {
        return prev.map((item) => (item.id === event.id ? event : item));
      }
      return [...prev, event];
    });
  }

  function handleDeleted(id: string) {
    setEvents((prev) => prev.filter((item) => item.id !== id));
  }

  function handleSelectSlot(day: Date, hour: number) {
    const start = new Date(day);
    start.setHours(hour, 0, 0, 0);
    openCreate(start);
  }

  return (
    <div className="space-y-6">
      <PageHeader segments={["Calendar"]} />

      <CalendarHeader
        date={currentDate}
        view={view}
        onToday={() => handleNavigate("today")}
        onNavigate={(direction) => handleNavigate(direction)}
        onViewChange={handleViewChange}
        onNewEvent={() => {
          const start = new Date(currentDate);
          start.setHours(9, 0, 0, 0);
          openCreate(start);
        }}
      />

      {view === "month" ? (
        <CalendarMonthView
          date={currentDate}
          events={sortedEvents}
          onSelectDay={(day) => {
            setCurrentDate(startOfDay(day));
            setView("day");
          }}
          onSelectEvent={openEdit}
        />
      ) : null}

      {view === "week" ? (
        <CalendarWeekView
          date={currentDate}
          events={sortedEvents}
          onSelectEvent={openEdit}
          onSelectSlot={handleSelectSlot}
        />
      ) : null}

      {view === "day" ? (
        <CalendarDayView
          date={currentDate}
          events={sortedEvents}
          onSelectEvent={openEdit}
          onSelectSlot={handleSelectSlot}
        />
      ) : null}

      {view === "agenda" ? (
        <CalendarAgendaView
          date={currentDate}
          events={sortedEvents}
          onSelectEvent={openEdit}
        />
      ) : null}

      <EventFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={selectedEvent}
        defaultStart={draftStart}
        persistence={persistence}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
