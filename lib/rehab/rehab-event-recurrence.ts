import {
  describeRecurrence,
  type RecurrenceRule,
} from "@/lib/rehab/recurrence";

export type RecurringEventLike = {
  recurrence?: RecurrenceRule | null;
  seriesId?: string | null;
  recurrenceAt?: string | null;
};

export function isRecurringRehabEvent(event: RecurringEventLike): boolean {
  return Boolean(event.recurrence ?? event.seriesId ?? event.recurrenceAt);
}

export function recurringEventLabel(event: RecurringEventLike): string {
  if (event.recurrence) {
    return describeRecurrence(event.recurrence);
  }
  return "Recurring event";
}
