"use client";

import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  PULSE_CATEGORY_LABELS,
  PULSE_IMPACT_LABELS,
  PULSE_URGENCY_LABELS,
  type PulseItem,
} from "@/types/pulse";

const impactVariant: Record<PulseItem["impact"], string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  high: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
};

const urgencyVariant: Record<PulseItem["urgency"], string> = {
  watch: "bg-muted text-muted-foreground",
  this_month: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  this_week: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  now: "bg-red-500/15 text-red-700 dark:text-red-300",
};

function formatDate(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function PulseCard({
  item,
  onSave,
  onDismiss,
  onMarkActed,
  onCreateTask,
  busy = false,
}: {
  item: PulseItem;
  onSave: () => void;
  onDismiss: () => void;
  onMarkActed: () => void;
  onCreateTask: () => void;
  busy?: boolean;
}) {
  const starts = formatDate(item.startsAt);
  const due = formatDate(item.dueAt);
  const expires = formatDate(item.expiresAt);

  return (
    <Card className="border-border/70 bg-card/80 shadow-sm">
      <CardHeader className="gap-3 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{PULSE_CATEGORY_LABELS[item.category]}</Badge>
          <Badge className={cn("border-0", impactVariant[item.impact])}>
            {PULSE_IMPACT_LABELS[item.impact]} impact
          </Badge>
          <Badge className={cn("border-0", urgencyVariant[item.urgency])}>
            {PULSE_URGENCY_LABELS[item.urgency]}
          </Badge>
          {item.confidence != null ? (
            <Badge variant="secondary">
              {Math.round(item.confidence * 100)}% confidence
            </Badge>
          ) : null}
        </div>
        <CardTitle className="text-lg leading-snug">{item.title}</CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          {item.summary}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pb-4">
        {item.whyItMatters ? (
          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Why it matters
            </p>
            <p className="mt-1 text-sm leading-relaxed">{item.whyItMatters}</p>
          </div>
        ) : null}

        {item.suggestedAction ? (
          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Suggested action
            </p>
            <p className="mt-1 text-sm leading-relaxed">{item.suggestedAction}</p>
          </div>
        ) : null}

        {(starts || due || expires) && (
          <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {starts ? <span>Starts {starts}</span> : null}
            {due ? <span>Due {due}</span> : null}
            {expires ? <span>Expires {expires}</span> : null}
          </div>
        )}

        {item.sourceTitle || item.sourceUrl ? (
          <div className="text-sm">
            {item.sourceUrl ? (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-foreground inline-flex items-center gap-1 underline-offset-4 hover:underline"
              >
                {item.sourceTitle ?? "Source"}
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            ) : (
              <span className="text-muted-foreground">{item.sourceTitle}</span>
            )}
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
        <Button
          type="button"
          size="sm"
          variant={item.status === "saved" ? "secondary" : "outline"}
          disabled={busy}
          onClick={onSave}
        >
          Save
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={onDismiss}>
          Dismiss
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={onMarkActed}>
          Mark acted
        </Button>
        <Button type="button" size="sm" disabled={busy} onClick={onCreateTask}>
          Create task
        </Button>
      </CardFooter>
    </Card>
  );
}
