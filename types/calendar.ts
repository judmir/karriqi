export const CALENDAR_EVENT_COLORS = [
  "blue",
  "green",
  "orange",
  "purple",
  "red",
] as const;

export type CalendarEventColor = (typeof CALENDAR_EVENT_COLORS)[number];
