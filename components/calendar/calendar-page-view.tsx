"use client";

import { useEffect } from "react";

import { CalendarClient } from "@/components/calendar/calendar-client";
import { ListPlaceholder } from "@/components/patterns/list-placeholder";
import { selectCalendarReady, useCalendarStore } from "@/stores/calendar-store";

function CalendarPageSkeleton() {
  return (
    <div
      className="animate-pulse space-y-6"
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

  if (!ready && loading) {
    return <CalendarPageSkeleton />;
  }

  return (
    <CalendarClient initialEvents={events} persistence={persistence} />
  );
}
