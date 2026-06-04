"use client";

import { useMemo } from "react";

import { Section } from "@/components/patterns/section";
import {
  dayProgress,
  getDaySlots,
  historyDays,
  ruleOf3ItemStatus,
} from "@/lib/rule-of-3/rule-of-3-utils";
import { cn } from "@/lib/utils";
import { useRuleOf3Store } from "@/stores/rule-of-3-store";

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

function formatDate(planDate: string): string {
  const [y, m, d] = planDate.split("-").map(Number);
  return dateFmt.format(new Date(y, m - 1, d));
}

const STATUS_META = {
  done: { label: "Done", className: "text-emerald-600 dark:text-emerald-400" },
  blocked: { label: "Not covered", className: "text-amber-600 dark:text-amber-400" },
  open: { label: "Open", className: "text-muted-foreground" },
} as const;

export function RuleOf3History({ todayDate }: { todayDate: string }) {
  const days = useRuleOf3Store((state) => state.days);
  const history = useMemo(
    () => historyDays(days, todayDate),
    [days, todayDate],
  );

  if (history.length === 0) {
    return null;
  }

  return (
    <Section title="History">
      <ul className="flex flex-col gap-4">
        {history.map((day) => {
          const slots = getDaySlots(day).filter((slot) => slot.item);
          const progress = dayProgress(day);
          return (
            <li
              key={day.planDate}
              className="rounded-xl border border-border/70 bg-muted/10 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">
                  {formatDate(day.planDate)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {progress.done}/{progress.planned} done
                </span>
              </div>
              <ol className="mt-3 space-y-2">
                {slots.map((slot) => {
                  const item = slot.item!;
                  const status = ruleOf3ItemStatus(item);
                  const meta = STATUS_META[status];
                  return (
                    <li key={slot.position} className="text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <span
                          className={cn(
                            "min-w-0",
                            status === "done" &&
                              "text-muted-foreground line-through",
                          )}
                        >
                          <span className="text-muted-foreground">
                            {slot.position}.
                          </span>{" "}
                          {item.title}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 text-xs font-medium",
                            meta.className,
                          )}
                        >
                          {meta.label}
                        </span>
                      </div>
                      {status === "blocked" && item.blockedReason ? (
                        <p className="mt-0.5 pl-4 text-xs text-muted-foreground">
                          {item.blockedReason}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
              {day.reflection ? (
                <p className="mt-3 border-t border-border/50 pt-2 text-xs italic text-muted-foreground">
                  {day.reflection}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
