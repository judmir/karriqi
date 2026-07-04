"use client";

import {
  setHours,
  setMinutes,
  startOfDay,
} from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { CalendarAgendaView } from "@/components/calendar/calendar-agenda-view";
import { CalendarDndProvider } from "@/components/calendar/calendar-dnd";
import { CalendarEventsLoader } from "@/components/calendar/calendar-events-loader";
import { CalendarHeader } from "@/components/calendar/calendar-header";
import { CalendarMonthView } from "@/components/calendar/calendar-month-view";
import { CalendarSourcesProvider } from "@/components/calendar/calendar-sources-context";
import {
  CalendarDayView,
  CalendarWeekView,
} from "@/components/calendar/calendar-time-views";
import { EventFormDialog } from "@/components/calendar/event-form-dialog";
import { RehabJournalDialog } from "@/components/rehab/rehab-journal-dialog";
import {
  calendarEventActionsFor,
  type CalendarClientVariant,
} from "@/lib/calendar/calendar-event-actions";
import {
  calendarViewRange,
  calendarViewRangeKey,
} from "@/lib/calendar/calendar-view-range";
import { filterEventsBySelectedCalendars } from "@/lib/calendar/google-event-colors";
import { navigateDate } from "@/lib/calendar/calendar-utils";
import { expandRehabEvents } from "@/lib/rehab/expand-rehab-events";
import { syncGoogleCalendarAction } from "@/lib/google-calendar/sync-actions";
import {
  loadCalendarEventsInRangeAction,
  loadRehabEventsInRangeAction,
} from "@/stores/load-actions";
import { useCalendarStore } from "@/stores/calendar-store";
import { useRehabPlanStore } from "@/stores/rehab-plan-store";
import type { CalendarEvent, CalendarView, GoogleCalendarSource } from "@/types/calendar";
import type { RehabPlanEvent } from "@/types/rehab";

/** Minimum gap between focus-triggered Google syncs. */
const FOCUS_SYNC_MIN_INTERVAL_MS = 60_000;

type GoogleSyncOptions = {
  enabled: boolean;
  lastSyncedAt: string | null;
  googleEmail: string | null;
  calendarSources?: GoogleCalendarSource[];
  syncOnMount?: boolean;
};

export function CalendarClient({
  initialEvents = [],
  persistence,
  googleSync,
  readOnly = false,
  variant = "family",
}: {
  initialEvents?: CalendarEvent[];
  persistence: boolean;
  googleSync?: GoogleSyncOptions;
  /** View-only mode: no create/edit/delete; Google is source of truth. */
  readOnly?: boolean;
  /** Which event store/actions to use (family calendar vs rehab plan). */
  variant?: CalendarClientVariant;
}) {
  const eventActions = calendarEventActionsFor(variant);
  const syncGlobalStore = variant === "family";
  const syncRehabStore = variant === "rehab";
  const router = useRouter();
  const didMountSync = useRef(false);
  const lastFocusSyncAt = useRef(0);
  const [localEvents, setLocalEvents] = useState(initialEvents);
  const [rehabRangeEvents, setRehabRangeEvents] = useState<RehabPlanEvent[]>([]);
  const setEvents = syncRehabStore ? undefined : setLocalEvents;
  const [rangeLoading, setRangeLoading] = useState(() => persistence);
  const [calendarSources, setCalendarSources] = useState<GoogleCalendarSource[]>(
    googleSync?.calendarSources ?? [],
  );
  const [view, setView] = useState<CalendarView>("month");
  const [currentDate, setCurrentDate] = useState(() => startOfDay(new Date()));
  const viewRange = useMemo(
    () => calendarViewRange(view, currentDate),
    [view, currentDate],
  );
  const rangeKey = useMemo(
    () => calendarViewRangeKey(view, currentDate),
    [view, currentDate],
  );

  const events = useMemo(() => {
    if (syncRehabStore) {
      return expandRehabEvents(
        rehabRangeEvents,
        viewRange.start,
        viewRange.end,
      );
    }
    return localEvents;
  }, [syncRehabStore, rehabRangeEvents, localEvents, viewRange.end, viewRange.start]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [journalOpen, setJournalOpen] = useState(false);
  const [journalEvent, setJournalEvent] = useState<CalendarEvent | null>(null);
  const [draftStart, setDraftStart] = useState(() => new Date());
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(
    googleSync?.lastSyncedAt ?? null,
  );

  useEffect(() => {
    if (!persistence) {
      return;
    }

    let cancelled = false;
    setRangeLoading(true);

    const payload = {
      startIso: viewRange.start.toISOString(),
      endIso: viewRange.end.toISOString(),
    };

    const finish = () => {
      if (!cancelled) {
        setRangeLoading(false);
      }
    };

    if (syncRehabStore) {
      void loadRehabEventsInRangeAction(payload)
        .then((result) => {
          if (cancelled || !result.ok) {
            return;
          }
          setRehabRangeEvents(result.events);
        })
        .finally(finish);
    } else {
      void loadCalendarEventsInRangeAction(payload)
        .then((result) => {
          if (cancelled || !result.ok) {
            return;
          }
          setLocalEvents(result.events);
          useCalendarStore.getState().setEvents(result.events);
        })
        .finally(finish);
    }

    return () => {
      cancelled = true;
    };
  }, [persistence, rangeKey, syncRehabStore, viewRange.end, viewRange.start]);

  useEffect(() => {
    if (!syncGlobalStore) {
      return;
    }
    useCalendarStore.getState().setEvents(events);
  }, [events, syncGlobalStore]);

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

  const refetchViewRange = useCallback(async () => {
    if (!persistence) {
      return;
    }
    const payload = {
      startIso: viewRange.start.toISOString(),
      endIso: viewRange.end.toISOString(),
    };
    if (syncRehabStore) {
      const result = await loadRehabEventsInRangeAction(payload);
      if (!result.ok) {
        return;
      }
      setRehabRangeEvents(result.events);
      return;
    }
    const result = await loadCalendarEventsInRangeAction(payload);
    if (!result.ok) {
      return;
    }
    setLocalEvents(result.events);
    useCalendarStore.getState().setEvents(result.events);
  }, [persistence, syncRehabStore, viewRange.end, viewRange.start]);

  const runSync = useCallback(
    async (options?: { quiet?: boolean }) => {
      if (!googleSync?.enabled) {
        return;
      }

      setSyncing(true);
      setRangeLoading(true);
      try {
        const rangePayload = {
          startIso: viewRange.start.toISOString(),
          endIso: viewRange.end.toISOString(),
        };
        const result = await syncGoogleCalendarAction(rangePayload);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }

        setEvents?.(result.events);
        setLastSyncedAt(result.lastSyncedAt);
        if (result.calendarSources) {
          setCalendarSources(result.calendarSources);
        }
        useCalendarStore.getState().setEvents(result.events);

        if (!options?.quiet && (result.pulled > 0 || result.pushed > 0 || result.deleted > 0)) {
          toast.success(
            readOnly
              ? `Synced — ${result.pulled} updated from Google.`
              : `Synced — ${result.pulled} pulled, ${result.pushed} pushed.`,
          );
        }
      } catch {
        if (!options?.quiet) {
          toast.error("Sync failed.");
        }
      } finally {
        setSyncing(false);
        setRangeLoading(false);
      }
    },
    [googleSync?.enabled, readOnly, setEvents, viewRange.end, viewRange.start],
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
      // Throttle: quick app/tab switches should not trigger a full Google
      // sync + event refetch every time the window regains focus.
      if (Date.now() - lastFocusSyncAt.current < FOCUS_SYNC_MIN_INTERVAL_MS) {
        return;
      }
      lastFocusSyncAt.current = Date.now();
      void runSync({ quiet: true });
    }

    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [googleSync?.enabled, syncing, runSync]);

  const openCreate = useCallback((start: Date) => {
    setSelectedEvent(null);
    setDraftStart(start);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback(
    (event: CalendarEvent) => {
      if (
        syncRehabStore &&
        (event as Partial<RehabPlanEvent>).eventKind === "journal"
      ) {
        setJournalEvent(event);
        setJournalOpen(true);
        return;
      }
      setSelectedEvent(event);
      setDraftStart(new Date(event.startAt));
      setDialogOpen(true);
    },
    [syncRehabStore],
  );

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
    if (syncRehabStore) {
      void refetchViewRange();
      return;
    }
    if (!setEvents) {
      return;
    }
    setEvents((prev) => {
      const exists = prev.some((item) => item.id === event.id);
      if (exists) {
        return prev.map((item) => (item.id === event.id ? event : item));
      }
      return [...prev, event];
    });
  }

  function handleDeleted(id: string) {
    if (syncRehabStore) {
      setDialogOpen(false);
      setSelectedEvent(null);
      void refetchViewRange();
      return;
    }
    if (!setEvents) {
      return;
    }
    setEvents((prev) => prev.filter((item) => item.id !== id));
    setDialogOpen(false);
    setSelectedEvent(null);
  }

  function handleSelectSlot(day: Date, hour: number) {
    if (readOnly) {
      return;
    }
    const start = new Date(day);
    start.setHours(hour, 0, 0, 0);
    openCreate(start);
  }

  function handleCreateOnDay(day: Date) {
    if (readOnly) {
      return;
    }
    openCreate(setMinutes(setHours(startOfDay(day), 9), 0));
  }

  const persistEventMove = useCallback(
    async (event: CalendarEvent) => {
      if (readOnly) {
        return;
      }

      if (syncRehabStore) {
        if (!persistence) {
          useRehabPlanStore.getState().upsertLocalEvent(event as RehabPlanEvent);
          return;
        }
        const result = await useRehabPlanStore
          .getState()
          .updateEventSchedule(event);
        if (!result.ok) {
          toast.error(result.message);
        } else {
          void refetchViewRange();
        }
        return;
      }

      setEvents?.((prev) =>
        prev.map((item) => (item.id === event.id ? event : item)),
      );

      if (!persistence) {
        return;
      }

      const result = await eventActions.update({
        id: event.id,
        startAt: event.startAt,
        endAt: event.endAt,
        allDay: event.allDay,
      });

      if (!result.ok) {
        toast.error(result.message);
        if (syncGlobalStore) {
          void loadCalendarEventsInRangeAction({
            startIso: viewRange.start.toISOString(),
            endIso: viewRange.end.toISOString(),
          }).then((fresh) => {
            if (fresh.ok) {
              setLocalEvents(fresh.events);
              useCalendarStore.getState().setEvents(fresh.events);
            }
          });
        }
      }
    },
    [
      eventActions,
      persistence,
      readOnly,
      refetchViewRange,
      setEvents,
      syncGlobalStore,
      syncRehabStore,
      viewRange.end,
      viewRange.start,
    ],
  );

  return (
    <CalendarSourcesProvider sources={calendarSources}>
      <CalendarDndProvider
        events={sortedEvents}
        onEventMoved={persistEventMove}
        enabled={!readOnly}
      >
        <div className="flex h-full min-h-0 w-full flex-1 flex-col gap-4 p-4 md:p-6">
          <CalendarHeader
            date={currentDate}
            view={view}
            onToday={() => handleNavigate("today")}
            onNavigate={(direction) => handleNavigate(direction)}
            onViewChange={handleViewChange}
            onNewEvent={
              readOnly
                ? undefined
                : () => {
                    const start = new Date(currentDate);
                    start.setHours(9, 0, 0, 0);
                    openCreate(start);
                  }
            }
            onSync={googleSync?.enabled ? () => void runSync() : undefined}
            syncing={syncing}
            lastSyncedAt={lastSyncedAt}
            googleEmail={googleSync?.googleEmail}
            readOnly={readOnly}
          />

          <div className="relative min-h-0 flex-1">
          {rangeLoading ? (
            <CalendarEventsLoader view={view} />
          ) : (
            <>
          {view === "month" ? (
            <CalendarMonthView
              date={currentDate}
              events={sortedEvents}
              onSelectDay={(day) => {
                setCurrentDate(startOfDay(day));
                setView("day");
              }}
              onSelectEvent={openEdit}
              onCreateEvent={readOnly ? undefined : handleCreateOnDay}
            />
          ) : null}

          {view === "week" ? (
            <CalendarWeekView
              date={currentDate}
              events={sortedEvents}
              onSelectEvent={openEdit}
              onSelectSlot={readOnly ? undefined : handleSelectSlot}
            />
          ) : null}

          {view === "day" ? (
            <CalendarDayView
              date={currentDate}
              events={sortedEvents}
              onSelectEvent={openEdit}
              onSelectSlot={readOnly ? undefined : handleSelectSlot}
            />
          ) : null}

          {view === "agenda" ? (
            <CalendarAgendaView
              date={currentDate}
              events={sortedEvents}
              onSelectEvent={openEdit}
            />
          ) : null}
            </>
          )}
          </div>

          <EventFormDialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                setSelectedEvent(null);
              }
            }}
            event={selectedEvent}
            defaultStart={draftStart}
            persistence={persistence}
            readOnly={readOnly}
            variant={variant}
            onSaved={handleSaved}
            onDeleted={handleDeleted}
          />

          <RehabJournalDialog
            open={journalOpen && journalEvent !== null}
            onOpenChange={setJournalOpen}
            event={journalEvent}
            persistence={persistence}
            variant={variant}
            onSaved={(event) => {
              handleSaved(event);
              setJournalOpen(false);
            }}
          />
        </div>
      </CalendarDndProvider>
    </CalendarSourcesProvider>
  );
}
