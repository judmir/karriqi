"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import { eventAppearance } from "@/lib/calendar/google-event-colors";
import type { CalendarEvent, GoogleCalendarSource } from "@/types/calendar";

type CalendarSourcesContextValue = {
  sources: GoogleCalendarSource[];
  appearanceForEvent: (event: CalendarEvent) => ReturnType<typeof eventAppearance>;
};

const CalendarSourcesContext = createContext<CalendarSourcesContextValue>({
  sources: [],
  appearanceForEvent: (event) => eventAppearance(event, []),
});

export function CalendarSourcesProvider({
  sources,
  children,
}: {
  sources: GoogleCalendarSource[];
  children: ReactNode;
}) {
  const appearanceForEvent = useCallback(
    (event: CalendarEvent) => eventAppearance(event, sources),
    [sources],
  );

  const value = useMemo(
    () => ({ sources, appearanceForEvent }),
    [sources, appearanceForEvent],
  );

  return (
    <CalendarSourcesContext.Provider value={value}>
      {children}
    </CalendarSourcesContext.Provider>
  );
}

export function useCalendarSources() {
  return useContext(CalendarSourcesContext);
}
