import { InfoIcon } from "lucide-react";

export function CalendarReadOnlyBanner() {
  return (
    <div
      role="status"
      className="border-border bg-muted/40 text-muted-foreground flex items-start gap-2 rounded-lg border px-3 py-2 text-sm"
    >
      <InfoIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>
        View-only calendar. Add or change events in{" "}
        <span className="text-foreground font-medium">Google Calendar</span>, then
        tap <span className="text-foreground font-medium">Sync</span>.
      </p>
    </div>
  );
}
