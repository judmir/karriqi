import { ExternalLinkIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ApartmentFindingPayload } from "@/modules/operator/apartment-finding-schema";
import type { OperatorEntryRow } from "@/types/operator";
import { cn } from "@/lib/utils";

const BERLIN = "Europe/Berlin";

const updatedFmt = new Intl.DateTimeFormat("de-DE", {
  timeZone: BERLIN,
  dateStyle: "medium",
  timeStyle: "short",
});

function fmtRooms(rooms?: ApartmentFindingPayload["rooms"]): string | null {
  if (rooms === undefined || rooms === null) {
    return null;
  }
  if (typeof rooms === "number") {
    return String(rooms);
  }
  return rooms;
}

function fmtSqm(sqm?: ApartmentFindingPayload["sqm"]): string | null {
  if (sqm === undefined) return null;
  if (sqm === null) return null;
  return `${sqm} m²`;
}

function FactGrid({ facts }: { facts: { label: string; value: string }[] }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {facts.map((fact) => (
        <div key={fact.label} className="space-y-0.5">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {fact.label}
          </dt>
          <dd className="text-sm text-foreground">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export type ApartmentDetailViewProps = {
  row: OperatorEntryRow;
  payload: ApartmentFindingPayload;
};

export function ApartmentDetailView({ row, payload }: ApartmentDetailViewProps) {
  const sqmDisplay = fmtSqm(payload.sqm);
  const roomsDisplay = fmtRooms(payload.rooms);
  const facts = [
    { label: "Location", value: payload.location },
    { label: "Price", value: payload.priceText },
    ...(sqmDisplay ? [{ label: "Size", value: sqmDisplay }] : []),
    ...(roomsDisplay ? [{ label: "Rooms", value: roomsDisplay }] : []),
  ];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">{row.title}</h1>
        <CardDescription className="text-muted-foreground">
          Updated{" "}
          <time dateTime={row.updated_at}>{updatedFmt.format(new Date(row.updated_at))}</time>
        </CardDescription>
        {row.summary ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{row.summary}</p>
        ) : null}
      </header>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Facts</CardTitle>
        </CardHeader>
        <CardContent>
          <FactGrid facts={facts} />
        </CardContent>
      </Card>

      <Card className={cn("border-primary/25 bg-primary/[0.04]")}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Verdict</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-semibold tracking-tight text-foreground">{payload.verdict}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Hermes evaluation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {payload.hermesEvaluation}
          </p>
        </CardContent>
      </Card>

      <div>
        <a
          href={payload.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          View listing source <ExternalLinkIcon className="h-4 w-4" aria-hidden />
        </a>
      </div>
    </div>
  );
}
