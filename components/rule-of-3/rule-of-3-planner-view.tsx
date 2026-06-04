"use client";

import { useMemo, useState } from "react";

import { RuleOf3History } from "@/components/rule-of-3/rule-of-3-history";
import { RuleOf3SlotEditor } from "@/components/rule-of-3/rule-of-3-slot-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  dayProgress,
  findDay,
  getDaySlots,
  todayDateString,
  tomorrowDateString,
} from "@/lib/rule-of-3/rule-of-3-utils";
import { cn } from "@/lib/utils";
import { useRuleOf3Store } from "@/stores/rule-of-3-store";

const dayLabelFmt = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

function formatDayLabel(planDate: string): string {
  const [y, m, d] = planDate.split("-").map(Number);
  return dayLabelFmt.format(new Date(y, m - 1, d));
}

type DayTab = "today" | "tomorrow";

export function RuleOf3PlannerView() {
  const days = useRuleOf3Store((state) => state.days);
  const setReflection = useRuleOf3Store((state) => state.setReflection);

  const todayDate = useMemo(() => todayDateString(), []);
  const tomorrowDate = useMemo(() => tomorrowDateString(), []);

  const [tab, setTab] = useState<DayTab>("today");
  const planDate = tab === "today" ? todayDate : tomorrowDate;

  const day = findDay(days, planDate);
  const slots = getDaySlots(day);
  const progress = dayProgress(day);

  const [reflectionDraft, setReflectionDraft] = useState<string | null>(null);
  const reflectionValue = reflectionDraft ?? day?.reflection ?? "";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 pb-12 md:px-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Today succeeds if these 3 things move forward. Choose tomorrow&apos;s 3
          before the day ends.
        </p>
        <div className="inline-flex rounded-lg bg-muted p-[3px] text-sm font-medium">
          {(["today", "tomorrow"] as DayTab[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setTab(value);
                setReflectionDraft(null);
              }}
              className={cn(
                "rounded-md px-4 py-1.5 capitalize transition-colors",
                tab === value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="gap-1 border-b border-border/60 pb-5">
          <CardTitle className="text-lg">{formatDayLabel(planDate)}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {progress.planned === 0
              ? "No priorities yet — name up to three."
              : `${progress.done} of ${progress.planned} done` +
                (progress.blocked > 0
                  ? ` · ${progress.blocked} not covered`
                  : "")}
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 pt-5">
          {slots.map((slot) => (
            <RuleOf3SlotEditor
              key={slot.position}
              planDate={planDate}
              slot={slot}
            />
          ))}
        </CardContent>
      </Card>

      <div className="space-y-2">
        <label
          htmlFor="rule-of-3-reflection"
          className="text-sm font-medium text-foreground"
        >
          Reflection (optional)
        </label>
        <Textarea
          id="rule-of-3-reflection"
          placeholder="What helped or got in the way today?"
          value={reflectionValue}
          onChange={(event) => setReflectionDraft(event.target.value)}
          onBlur={() => {
            if (reflectionDraft !== null && reflectionDraft !== (day?.reflection ?? "")) {
              void setReflection(planDate, reflectionDraft);
            }
            setReflectionDraft(null);
          }}
          rows={3}
        />
      </div>

      <RuleOf3History todayDate={todayDate} />
    </div>
  );
}
