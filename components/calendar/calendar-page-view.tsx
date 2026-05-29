"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { CalendarClient } from "@/components/calendar/calendar-client";
import { ListPlaceholder } from "@/components/patterns/list-placeholder";
import { selectCalendarReady, useCalendarStore } from "@/stores/calendar-store";
import type { CalendarEvent, GoogleCalendarSource } from "@/types/calendar";

function CalendarPageSkeleton() {
  return (
    <div
      className="flex h-full min-h-0 flex-1 animate-pulse flex-col"
      role="status"
      aria-label="Loading calendar"
    >
      <div className="space-y-3">
        <div className="bg-muted h-3 w-24 rounded-md" />
        <div className="bg-muted h-7 w-36 rounded-lg" />
      </div>
      <ListPlaceholder rows={6} />
    </div>
  );
}

function CalendarPageDemo() {
  const events = useCalendarStore((s) => s.events);
  const persistence = useCalendarStore((s) => s.persistence);
  const loading = useCalendarStore((s) => s.loading);
  const ready = useCalendarStore(selectCalendarReady);
  const ensureLoaded = useCalendarStore((s) => s.ensureLoaded);

  useEffect(() => {
    void ensureLoaded();
  }, [ensureLoaded]);

  if (!ready && loading) {
    return <CalendarPageSkeleton />;
  }

  return (
    <CalendarClient initialEvents={events} persistence={persistence} />
  );
}

type CalendarPageViewProps = {
  initialEvents?: CalendarEvent[];
  calendarSources?: GoogleCalendarSource[];
  lastSyncedAt?: string | null;
  googleEmail?: string | null;
  googleError?: string | null;
  syncOnMount?: boolean;
  readOnly?: boolean;
};

/** Demo mode omits props; connected Google mode passes server-fetched events. */
export function CalendarPageView(props: CalendarPageViewProps = {}) {
  if (props.initialEvents === undefined) {
    return <CalendarPageDemo />;
  }

  return (
    <CalendarConnectedCalendar
      initialEvents={props.initialEvents}
      calendarSources={props.calendarSources ?? []}
      lastSyncedAt={props.lastSyncedAt ?? null}
      googleEmail={props.googleEmail ?? null}
      googleError={props.googleError ?? null}
      syncOnMount={props.syncOnMount ?? false}
      readOnly={props.readOnly ?? false}
    />
  );
}

function CalendarConnectedCalendar({
  initialEvents,
  calendarSources,
  lastSyncedAt,
  googleEmail,
  googleError,
  syncOnMount,
  readOnly,
}: {
  initialEvents: CalendarEvent[];
  calendarSources: GoogleCalendarSource[];
  lastSyncedAt: string | null;
  googleEmail: string | null;
  googleError: string | null;
  syncOnMount: boolean;
  readOnly: boolean;
}) {
  const shownError = useRef(false);

  useEffect(() => {
    if (!googleError || shownError.current) {
      return;
    }
    shownError.current = true;
    toast.error(decodeURIComponent(googleError));
  }, [googleError]);

  return (
    <CalendarClient
      initialEvents={initialEvents}
      persistence
      readOnly={readOnly}
      googleSync={{
        enabled: true,
        lastSyncedAt,
        googleEmail,
        calendarSources,
        syncOnMount,
      }}
    />
  );
}

export type { CalendarPageViewProps };
