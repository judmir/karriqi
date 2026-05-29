import type { CSSProperties } from "react";

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

const DEFAULT_CALENDAR_COLOR = "#039be5";

export function resolveDefaultCalendarColor(
  sources: GoogleCalendarSource[],
): string {
  const primary = sources.find((source) => source.primary);
  if (primary) {
    return normalizeHex(primary.backgroundColor);
  }
  if (sources.length > 0) {
    return normalizeHex(sources[0]!.backgroundColor);
  }
  return DEFAULT_CALENDAR_COLOR;
}

export type EventAppearance = {
  className: string;
  style?: CSSProperties;
  dotClassName?: string;
  dotStyle?: CSSProperties;
  accentColor: string;
};

export type EventAppearanceDisplay = "list" | "block";

export function eventAppearance(
  event: CalendarEvent,
  sources: GoogleCalendarSource[],
  display: EventAppearanceDisplay = "list",
): EventAppearance {
  const accentColor = resolveDefaultCalendarColor(sources);

  if (event.allDay || display === "block") {
    return {
      accentColor,
      className: "border-0 text-white",
      style: {
        backgroundColor: hexToRgba(accentColor, 0.85),
        color: "#ffffff",
      },
      dotStyle: { backgroundColor: accentColor },
    };
  }

  return {
    accentColor,
    className: "border-0 bg-transparent text-white",
    style: { color: "#ffffff" },
    dotStyle: { backgroundColor: accentColor },
  };
}

export function filterEventsBySelectedCalendars(
  events: CalendarEvent[],
  _sources: GoogleCalendarSource[],
): CalendarEvent[] {
  return events;
}
