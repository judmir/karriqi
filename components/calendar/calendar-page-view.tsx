"use client";

import { useEffect, useMemo } from "react";

import { CalendarClient } from "@/components/calendar/calendar-client";
import { ListPlaceholder } from "@/components/patterns/list-placeholder";
import { getMockCalendarEvents } from "@/lib/calendar/mock-calendar-events";
import { selectCalendarReady, useCalendarStore } from "@/stores/calendar-store";

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

export function CalendarPageView() {
  const events = useCalendarStore((s) => s.events);
  const persistence = useCalendarStore((s) => s.persistence);
  const loading = useCalendarStore((s) => s.loading);
  const ready = useCalendarStore(selectCalendarReady);
  const ensureLoaded = useCalendarStore((s) => s.ensureLoaded);

  useEffect(() => {
    void ensureLoaded();
  }, [ensureLoaded]);

  const displayEvents = useMemo(
    () => (events.length > 0 ? events : getMockCalendarEvents()),
    [events],
  );

  if (!ready && loading) {
    return <CalendarPageSkeleton />;
  }

  return (
    <CalendarClient
      initialEvents={displayEvents}
      persistence={persistence && events.length > 0}
    />
  );
}