import {
  createCalendarEvent,
  deleteCalendarEvent,
  updateCalendarEvent,
} from "@/lib/calendar/calendar-actions";
import { rehabPlanEventActions as rehabStoreEventActions } from "@/lib/rehab/rehab-plan-event-actions";
import type { RecurrenceRule } from "@/lib/rehab/recurrence";
import type { CalendarEventColor } from "@/types/calendar";

export type CalendarEventActions = {
  create: (input: {
    title: string;
    description?: string | null;
    startAt: string;
    endAt: string;
    allDay?: boolean;
    color?: CalendarEventColor;
    /** Rehab-only: icon / activity type for the event. */
    eventKind?: string;
    /** Rehab-only: a recurrence rule makes this event a series master. */
    recurrence?: RecurrenceRule | null;
  }) => Promise<{ ok: true; id: string } | { ok: false; message: string }>;
  update: (input: {
    id: string;
    title?: string;
    description?: string | null;
    startAt?: string;
    endAt?: string;
    allDay?: boolean;
    color?: CalendarEventColor;
    eventKind?: string;
    recurrence?: RecurrenceRule | null;
  }) => Promise<{ ok: true } | { ok: false; message: string }>;
  delete: (id: string) => Promise<{ ok: true } | { ok: false; message: string }>;
};

export const familyCalendarEventActions: CalendarEventActions = {
  create: createCalendarEvent,
  update: updateCalendarEvent,
  delete: deleteCalendarEvent,
};

export { rehabStoreEventActions as rehabPlanEventActions };

export type CalendarClientVariant = "family" | "rehab";

export function calendarEventActionsFor(
  variant: CalendarClientVariant,
): CalendarEventActions {
  return variant === "rehab" ? rehabStoreEventActions : familyCalendarEventActions;
}
