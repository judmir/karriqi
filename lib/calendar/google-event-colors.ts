import type { CSSProperties } from "react";

import { eventColorClasses, eventDotClass } from "@/lib/calendar/calendar-utils";
import type { CalendarEvent, GoogleCalendarSource } from "@/types/calendar";

function normalizeHex(hex: string): string {
  const value = hex.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(value)) {
    return value;
  }
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    const [, r, g, b] = value;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return "#039be5";
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = normalizeHex(hex).slice(1);
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

export function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function resolveGoogleCalendarSource(
  event: CalendarEvent,
  sources: GoogleCalendarSource[],
): GoogleCalendarSource | undefined {
  if (!event.googleCalendarId) {
    return undefined;
  }
  return sources.find(
    (source) => source.googleCalendarId === event.googleCalendarId,
  );
}

export type EventAppearance = {
  className: string;
  style?: CSSProperties;
  dotClassName?: string;
  dotStyle?: CSSProperties;
};

export function eventAppearance(
  event: CalendarEvent,
  sources: GoogleCalendarSource[],
): EventAppearance {
  const source = resolveGoogleCalendarSource(event, sources);
  if (source) {
    const bg = normalizeHex(source.backgroundColor);
    const fg = source.foregroundColor
      ? normalizeHex(source.foregroundColor)
      : bg;

    return {
      className: "border",
      style: {
        backgroundColor: hexToRgba(bg, 0.18),
        borderColor: hexToRgba(bg, 0.42),
        color: fg,
      },
      dotStyle: { backgroundColor: bg },
    };
  }

  return {
    className: eventColorClasses(event.color),
    dotClassName: eventDotClass(event.color),
  };
}

export function filterEventsBySelectedCalendars(
  events: CalendarEvent[],
  sources: GoogleCalendarSource[],
): CalendarEvent[] {
  if (sources.length === 0) {
    return events;
  }

  const hidden = new Set(
    sources.filter((source) => !source.selected).map((s) => s.googleCalendarId),
  );

  return events.filter(
    (event) =>
      !event.googleCalendarId || !hidden.has(event.googleCalendarId),
  );
}
