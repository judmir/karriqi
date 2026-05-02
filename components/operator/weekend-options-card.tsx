import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { WeekendPlannerPayload } from "@/modules/operator/weekend-planner-schema";
import type { OperatorEntryRow } from "@/types/operator";

const BERLIN = "Europe/Berlin";

const dateTimeShort = new Intl.DateTimeFormat("de-DE", {
  timeZone: BERLIN,
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const dateRangePart = new Intl.DateTimeFormat("de-DE", {
  timeZone: BERLIN,
  weekday: "long",
  day: "numeric",
  month: "long",
});

const updatedFmt = new Intl.DateTimeFormat("de-DE", {
  timeZone: BERLIN,
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatWeekendRangeLabel(
  startsAt: string | null,
  endsAt: string | null,
): string | null {
  if (!startsAt || !endsAt) {
    return null;
  }
  const s = new Date(startsAt);
  const e = new Date(endsAt);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
    return null;
  }
  return `${dateRangePart.format(s)} — ${dateRangePart.format(e)}`;
}

function Chip({
  className,
  children,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-xs font-medium text-foreground/90",
        className,
      )}
    >
      {children}
    </span>
  );
}

export type WeekendOptionsCardProps =
  | {
      status: "empty";
    }
  | {
      status: "ready";
      row: OperatorEntryRow;
      payload: WeekendPlannerPayload;
    };

export function WeekendOptionsCard(props: WeekendOptionsCardProps) {
  if (props.status === "empty") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekend options</CardTitle>
          <CardDescription>
            Kid-friendly ideas tailored for your household. Your next plan will
            appear here after Hermes publishes it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
            No weekend plan yet. Hermes usually posts one on Thursday or Friday.
          </div>
        </CardContent>
      </Card>
    );
  }

  const { row, payload } = props;
  const rangeLabel = formatWeekendRangeLabel(row.starts_at, row.ends_at);
  const sortedItems = [...payload.items].sort((a, b) => a.rank - b.rank);

  return (
    <Card>
      <CardHeader className="gap-2 border-b border-border/60 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-lg">{row.title}</CardTitle>
            {row.summary ? (
              <CardDescription className="text-pretty text-sm leading-relaxed">
                {row.summary}
              </CardDescription>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-1 text-right text-xs text-muted-foreground">
            {rangeLabel ? (
              <span className="font-medium text-foreground/80">{rangeLabel}</span>
            ) : null}
            <span>{payload.locationLabel} · {payload.audience}</span>
          </div>
        </div>
        {payload.weatherSummary ? (
          <p className="text-sm text-muted-foreground">
            Weather: {payload.weatherSummary}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <ol className="space-y-5">
          {sortedItems.map((item) => (
            <li
              key={item.rank}
              className="grid gap-3 rounded-xl border border-border/80 bg-muted/15 p-4 sm:grid-cols-[auto_1fr]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                {item.rank}
              </div>
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="min-w-0 font-heading text-base leading-snug font-medium text-foreground">
                    {item.title}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <Chip>
                      {item.isIndoor ? "Indoors" : "Outdoors"}
                    </Chip>
                    {item.isRainFallback ? (
                      <Chip className="border-amber-500/35 bg-amber-500/10 text-amber-950 dark:text-amber-100">
                        Rain fallback
                      </Chip>
                    ) : null}
                    <Chip className="capitalize">{item.category}</Chip>
                  </div>
                </div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {dateTimeShort.format(new Date(item.startsAt))}
                </p>
                {item.subtitle ? (
                  <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                ) : null}
                {item.weatherNote ? (
                  <p className="text-xs text-muted-foreground">
                    Weather note: {item.weatherNote}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{item.costText}</span>
                  <span>Travel ~{item.travelTimeText}</span>
                </div>
                {item.bookingUrl ? (
                  <a
                    href={item.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Book or details
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 border-t text-xs text-muted-foreground">
        <span>
          Updated{" "}
          <time dateTime={row.updated_at}>
            {updatedFmt.format(new Date(row.updated_at))}
          </time>
        </span>
        <span className="text-muted-foreground/70">Source: Hermes</span>
      </CardFooter>
    </Card>
  );
}
