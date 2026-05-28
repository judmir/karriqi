export const CALENDAR_VIEWS = ["month", "week", "day", "agenda"] as const;

export type CalendarView = (typeof CALENDAR_VIEWS)[number];

export const CALENDAR_EVENT_COLORS = [
  "blue",
  "green",
  "orange",
  "purple",
  "red",
] as const;

export type CalendarEventColor = (typeof CALENDAR_EVENT_COLORS)[number];

export type CalendarEvent = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  allDay: boolean;
  color: CalendarEventColor;
  googleCalendarId?: string | null;
  source?: "local" | "google";
  createdAt: string;
  updatedAt: string;
};

export type GoogleCalendarSource = {
  googleCalendarId: string;
  summary: string;
  backgroundColor: string;
  foregroundColor: string | null;
  selected: boolean;
  primary: boolean;
  accessRole: string | null;
};

export type CalendarEventInput = {
  title: string;
  description?: string | null;
  startAt: string;
  endAt: string;
  allDay?: boolean;
  color?: CalendarEventColor;
};
