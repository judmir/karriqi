const DISABLED = new Set(["0", "false", "no", "off"]);

/**
 * When true, Karriqi calendar is view-only; create/edit/delete happen in Google Calendar.
 * Set `CALENDAR_READONLY=0` to re-enable local edits (e.g. demo mode without Google).
 */
export function isCalendarReadOnly(): boolean {
  const raw = process.env.CALENDAR_READONLY?.trim().toLowerCase();
  if (raw && DISABLED.has(raw)) {
    return false;
  }
  return true;
}

export const CALENDAR_READONLY_MESSAGE =
  "Calendar is read-only here. Create and edit events in Google Calendar, then sync.";
