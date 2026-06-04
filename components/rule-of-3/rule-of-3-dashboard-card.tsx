"use client";

import { ArrowRight, Target } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ROUTES } from "@/config/routes";
import {
  dayProgress,
  findDay,
  getDaySlots,
  ruleOf3ItemStatus,
  todayDateString,
} from "@/lib/rule-of-3/rule-of-3-utils";
import { cn } from "@/lib/utils";
import { useRuleOf3Store } from "@/stores/rule-of-3-store";

export function RuleOf3DashboardCard() {
  const days = useRuleOf3Store((state) => state.days);
  const setItemCompleted = useRuleOf3Store((state) => state.setItemCompleted);

  const todayDate = useMemo(() => todayDateString(), []);
  const day = findDay(days, todayDate);
  const slots = getDaySlots(day);
  const progress = dayProgress(day);
  const hasAny = progress.planned > 0;

  return (
    <Card>
      <CardHeader className="gap-2 border-b border-border/60 pb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="size-5 text-primary" aria-hidden />
              Today&apos;s Rule of 3
            </CardTitle>
            <CardDescription>
              The three things that make today a success.
            </CardDescription>
          </div>
          {hasAny ? (
            <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {progress.done}/{progress.planned} done
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        {hasAny ? (
          <ol className="space-y-2.5">
            {slots.map((slot) => {
              if (!slot.item) {
                return (
                  <li
                    key={slot.position}
                    className="flex items-center gap-3 rounded-lg border border-dashed border-muted-foreground/25 px-3 py-2.5 text-sm text-muted-foreground"
                  >
                    <span className="font-semibold text-muted-foreground/70">
                      {slot.position}
                    </span>
                    <span>{slot.label} — not set</span>
                  </li>
                );
              }
              const status = ruleOf3ItemStatus(slot.item);
              const completed = status === "done";
              const blocked = status === "blocked";
              return (
                <li
                  key={slot.position}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border border-border/70 bg-muted/15 px-3 py-2.5",
                    completed && "border-emerald-500/30 bg-emerald-500/5",
                    blocked && "border-amber-500/30 bg-amber-500/5",
                  )}
                >
                  <Checkbox
                    checked={completed}
                    onCheckedChange={(value) =>
                      void setItemCompleted(
                        todayDate,
                        slot.position,
                        Boolean(value),
                      )
                    }
                    className="mt-0.5 rounded-full"
                    aria-label={`Mark "${slot.item.title}" ${completed ? "not done" : "done"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm font-medium leading-snug",
                        completed && "text-muted-foreground line-through",
                      )}
                    >
                      {slot.item.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{slot.label}</p>
                    {blocked && slot.item.blockedReason ? (
                      <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                        Not covered: {slot.item.blockedReason}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
            No priorities yet for today. Pick the three things that matter most.
          </div>
        )}

        <Link
          href={ROUTES.ruleOfThree}
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {hasAny ? "Manage today & plan tomorrow" : "Set today's Rule of 3"}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </CardContent>
    </Card>
  );
}
