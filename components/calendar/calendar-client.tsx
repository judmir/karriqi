"use client";

import { setHours, setMinutes, startOfDay } from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { CalendarAgendaView } from "@/components/calendar/calendar-agenda-view";
import { CalendarDndProvider } from "@/components/calendar/calendar-dnd";
import { CalendarHeader } from "@/components/calendar/calendar-header";
import { CalendarMonthView } from "@/components/calendar/calendar-month-view";
import { CalendarSourcesProvider } from "@/components/calendar/calendar-sources-context";
import { CalendarSourcesSidebar } from "@/components/calendar/calendar-sources-sidebar";
import {
  CalendarDayView,
  CalendarWeekView,
} from "@/components/calendar/calendar-time-views";
import { EventFormDialog } from "@/components/calendar/event-form-dialog";
import { updateCalendarEvent } from "@/lib/calendar/calendar-actions";
import { filterEventsBySelectedCalendars } from "@/lib/calendar/google-event-colors";
import { navigateDate } from "@/lib/calendar/calendar-utils";
import { syncGoogleCalendarAction } from "@/lib/google-calendar/sync-actions";
import { useCalendarStore } from "@/stores/calendar-store";
import type { CalendarEvent, CalendarView, GoogleCalendarSource } from "@/types/calendar";

type GoogleSyncOptions = {
  enabled: boolean;
  lastSyncedAt: string | null;
  googleEmail: string | null;
  calendarSources?: GoogleCalendarSource[];
  syncOnMount?: boolean;
};

export function CalendarClient({
  initialEvents,
  persistence,
  googleSync,
}: {
  initialEvents: CalendarEvent[];
  persistence: boolean;
  googleSync?: GoogleSyncOptions;
}) {
  const router = useRouter();
  const didMountSync = useRef(false);
  const [events, setEvents] = useState(initialEvents);
  const [calendarSources, setCalendarSources] = useState<GoogleCalendarSource[]>(
    googleSync?.calendarSources ?? [],
  );
  const [view, setView] = useState<CalendarView>("month");
  const [currentDate, setCurrentDate] = useState(() => startOfDay(new Date()));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [draftStart, setDraftStart] = useState(() => new Date());
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(
    googleSync?.lastSyncedAt ?? null,
  );

  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  useEffect(() => {
    setCalendarSources(googleSync?.calendarSources ?? []);
  }, [googleSync?.calendarSources]);

  const visibleEvents = useMemo(
    () => filterEventsBySelectedCalendars(events, calendarSources),
    [events, calendarSources],
  );

  const sortedEvents = useMemo(
    () =>
      [...visibleEvents].sort(
        (a, b) =>
          new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      ),
    [visibleEvents],
  );

  const runSync = useCallback(
    async (options?: { quiet?: boolean }) => {
      if (!googleSync?.enabled) {
        return;
      }

      setSyncing(true);
      try {
        const result = await syncGoogleCalendarAction();
        if (!result.ok) {
          toast.error(result.message);
          return;
        }

        setEvents(result.events);
        setLastSyncedAt(result.lastSyncedAt);
        if (result.calendarSources) {
          setCalendarSources(result.calendarSources);
        }
        useCalendarStore.getState().setEvents(result.events);

        if (!options?.quiet && (result.pulled > 0 || result.pushed > 0 || result.deleted > 0)) {
          toast.success(
            `Synced — ${result.pulled} pulled, ${result.pushed} pushed.`,
          );
        }
      } catch {
        if (!options?.quiet) {
          toast.error("Sync failed.");
        }
      } finally {
        setSyncing(false);
      }
    },
    [googleSync?.enabled],
  );

  useEffect(() => {
    if (!googleSync?.enabled || !googleSync.syncOnMount || didMountSync.current) {
      return;
    }
    didMountSync.current = true;
    router.replace("/calendar", { scroll: false });
    toast.success("Google Calendar connected. Syncing events…");
    void runSync();
  }, [googleSync?.enabled, googleSync?.syncOnMount, router, runSync]);

  useEffect(() => {
    if (!googleSync?.enabled) {
      return;
    }

    function onFocus() {
      if (document.visibilityState !== "visible" || syncing) {
        return;
      }
      void runSync({ quiet: true });
    }

    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [googleSync?.enabled, syncing, runSync]);

  useEffect(() => {
    useCalendarStore.getState().setEvents(events);
  }, [events]);

  const openCreate = useCallback((start: Date) => {
    setSelectedEvent(null);
    setDraftStart(start);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setDraftStart(new Date(event.startAt));
    setDialogOpen(true);
  }, []);

  const handleNavigate = useCallback(
    (direction: "prev" | "next" | "today") => {
      setCurrentDate((prev: Date) => navigateDate(prev, view, direction));
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

  function handleCreateOnDay(day: Date) {
    openCreate(setMinutes(setHours(startOfDay(day), 9), 0));
  }

  const persistEventMove = useCallback(
    async (event: CalendarEvent) => {
      setEvents((prev) =>
        prev.map((item) => (item.id === event.id ? event : item)),
      );

      if (!persistence) {
        return;
      }

      const result = await updateCalendarEvent({
        id: event.id,
        startAt: event.startAt,
        endAt: event.endAt,
        allDay: event.allDay,
      });

      if (!result.ok) {
        toast.error(result.message);
        useCalendarStore.getState().invalidate();
        void useCalendarStore.getState().ensureLoaded();
      }
    },
    [persistence],
  );

  return (
    <CalendarSourcesProvider sources={calendarSources}>
      <CalendarDndProvider events={sortedEvents} onEventMoved={persistEventMove}>
        <div className="flex h-full min-h-0 w-full flex-1 flex-col gap-4 p-4 md:p-6">
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
            onSync={googleSync?.enabled ? () => void runSync() : undefined}
            syncing={syncing}
            lastSyncedAt={lastSyncedAt}
            googleEmail={googleSync?.googleEmail}
          />

          <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
            {googleSync?.enabled && calendarSources.length > 0 ? (
              <CalendarSourcesSidebar
                sources={calendarSources}
                onSourcesChange={setCalendarSources}
                className="lg:self-start"
              />
            ) : null}

            <div className="min-h-0 flex-1">
          {view === "month" ? (
            <CalendarMonthView
              date={currentDate}
              events={sortedEvents}
              onSelectDay={(day) => {
                setCurrentDate(startOfDay(day));
                setView("day");
              }}
              onSelectEvent={openEdit}
              onCreateEvent={handleCreateOnDay}
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
            </div>
          </div>

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
      </CalendarDndProvider>
    </CalendarSourcesProvider>
  );
}
