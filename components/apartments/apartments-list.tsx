import Link from "next/link";

import { apartmentsPath } from "@/config/routes";
import type { ApartmentFindingListItemView } from "@/lib/repositories/apartment-findings";
import { cn } from "@/lib/utils";

const BERLIN = "Europe/Berlin";

const updatedFmt = new Intl.DateTimeFormat("de-DE", {
  timeZone: BERLIN,
  dateStyle: "medium",
  timeStyle: "short",
});

function NewBadge() {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-200",
      )}
    >
      New
    </span>
  );
}

export function ApartmentsList({ items }: { items: ApartmentFindingListItemView[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No apartment evaluations yet. When Hermes posts a finding, it will appear here alongside
        your Discord notification.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.row.id}>
          <Link
            href={apartmentsPath(item.row.id)}
            className={cn(
              "block rounded-lg border border-border bg-card p-4 shadow-sm transition-colors",
              "hover:border-primary/30 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 space-y-1">
                <h2 className="font-semibold tracking-tight text-foreground">{item.row.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {item.payload.location} · {item.payload.priceText}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {item.unseen ? <NewBadge /> : null}
                <time className="text-xs text-muted-foreground" dateTime={item.row.updated_at}>
                  {updatedFmt.format(new Date(item.row.updated_at))}
                </time>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
