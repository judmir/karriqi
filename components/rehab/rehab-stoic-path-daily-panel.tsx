"use client";

import { format } from "date-fns";
import { Check, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PROGRAM_START } from "@/modules/rehab/neuro-rehab-2026/constants";
import {
  getStoicPathExerciseId,
  getStoicExerciseById,
  getStoicExerciseForDate,
  getStoicProgramDayIndex,
  isPersistedStoicPathPlanEvent,
  STOIC_PROCESS_SCORE_LABELS,
  STOIC_REHAB_SLOT_LABELS,
  STOIC_SUGGESTED_WHEN_LABELS,
} from "@/lib/rehab/stoic-rehab-utils";
import { cn } from "@/lib/utils";
import { useRehabPlanStore } from "@/stores/rehab-plan-store";
import { useStoicRehabStore } from "@/stores/stoic-rehab-store";
import type { StoicRehabProcessScore } from "@/types/stoic-rehab";

const textareaClassName = cn(
  "border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30",
  "min-h-24 w-full resize-y rounded-lg border px-3 py-2 text-sm leading-relaxed outline-none transition-colors focus-visible:ring-3",
);

function StoicTheoryContent({ text }: { text: string }) {
  return (
    <div className="space-y-3">
      {text.split("\n\n").map((paragraph) => (
        <p key={paragraph.slice(0, 48)} className="text-sm leading-relaxed">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

type RehabStoicPathDailyPanelProps = {
  date?: Date;
  exerciseId?: string;
  onSaved?: () => void;
  compact?: boolean;
};

export function RehabStoicPathDailyPanel({
  date = new Date(),
  exerciseId,
  onSaved,
  compact = false,
}: RehabStoicPathDailyPanelProps) {
  const saveCompletion = useStoicRehabStore((state) => state.saveCompletion);
  const toggleOccurrenceCompleted = useRehabPlanStore(
    (state) => state.toggleOccurrenceCompleted,
  );
  const planEvents = useRehabPlanStore((state) => state.events);
  const exercise = useMemo(() => {
    if (exerciseId) {
      const byId = getStoicExerciseById(exerciseId);
      if (byId) {
        return byId;
      }
    }
    return getStoicExerciseForDate(PROGRAM_START, date, "morning");
  }, [date, exerciseId]);
  const programDay = useMemo(
    () => getStoicProgramDayIndex(PROGRAM_START, date),
    [date],
  );
  const existing = useStoicRehabStore((state) =>
    state.getCompletionForExercise(exercise.id),
  );
  const showProcessScore = exercise.slot === "evening";
  const isMorning = exercise.slot === "morning";
  const isEvening = exercise.slot === "evening";

  const [journalText, setJournalText] = useState(existing?.journalText ?? "");
  const [processScore, setProcessScore] = useState<
    StoicRehabProcessScore | undefined
  >(existing?.processScore);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setJournalText(existing?.journalText ?? "");
    setProcessScore(existing?.processScore);
  }, [existing, exercise.id]);

  const planEvent = useMemo(
    () =>
      planEvents.find(
        (event) => getStoicPathExerciseId(event) === exercise.id,
      ) ?? null,
    [exercise.id, planEvents],
  );

  async function handleComplete() {
    if (pending) {
      return;
    }
    setPending(true);
    try {
      const result = await saveCompletion({
        exerciseId: exercise.id,
        journalText,
        processScore: showProcessScore ? processScore : undefined,
        adapted: existing?.adapted ?? false,
      });
      if (!result.ok) {
        return;
      }
      if (planEvent && isPersistedStoicPathPlanEvent(planEvent)) {
        await toggleOccurrenceCompleted(planEvent, true);
      }
      toast.success("Calm rep completed.");
      onSaved?.();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      <div className="space-y-1">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Today&apos;s Quest · Day {programDay} · Week {exercise.week}
        </p>
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          {exercise.title}
        </h2>
        <p className="text-muted-foreground text-sm">{exercise.dayTheme}</p>
        <p className="text-muted-foreground text-xs capitalize">
          Virtue: {exercise.virtue} · {exercise.category}
        </p>
        <p className="text-muted-foreground text-xs">
          {format(date, "EEE d MMM yyyy")} · {STOIC_REHAB_SLOT_LABELS[exercise.slot]} ·{" "}
          {STOIC_SUGGESTED_WHEN_LABELS[exercise.suggestedWhen]} · ~
          {exercise.durationMinutes} min
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {exercise.tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="capitalize">
            {tag.replace("-", " ")}
          </Badge>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Why this matters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <StoicTheoryContent text={exercise.theory} />
          {isMorning ? (
            <div className="border-border space-y-2 border-t pt-3">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Your intention
              </p>
              <p className="text-sm leading-relaxed">{exercise.task}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {!isMorning ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {isEvening ? "Evening reflection" : "Train the response"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{exercise.task}</p>
          </CardContent>
        </Card>
      ) : null}

      {!isMorning ? (
        <div className="space-y-2">
          <Label htmlFor="stoic-journal" className="text-sm">
            Journal prompt
          </Label>
          <p className="text-muted-foreground text-sm">{exercise.journalPrompt}</p>
          <Textarea
            id="stoic-journal"
            className={textareaClassName}
            value={journalText}
            onChange={(event) => setJournalText(event.target.value)}
            placeholder={isEvening ? "Evening reflection…" : "Optional note…"}
          />
        </div>
      ) : null}

      {showProcessScore ? (
        <div className="space-y-2">
          <span className="text-sm font-medium">Process score</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {([0, 1, 2, 3] as const).map((score) => {
              const selected = processScore === score;
              return (
                <button
                  key={score}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setProcessScore(selected ? undefined : score)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                    selected
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-card hover:bg-muted/60",
                  )}
                >
                  <span className="block font-semibold">{score}</span>
                  <span className="block text-xs opacity-80">
                    {STOIC_PROCESS_SCORE_LABELS[score]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <Button
          type="button"
          onClick={() => void handleComplete()}
          disabled={pending}
          className="gap-2"
        >
          {existing ? (
            <Check className="size-4" aria-hidden />
          ) : (
            <Sparkles className="size-4" aria-hidden />
          )}
          {pending
            ? "Saving…"
            : existing
              ? "Update completion"
              : "Mark complete"}
        </Button>
        {existing ? (
          <span className="text-muted-foreground text-xs">
            Completed{" "}
            {format(new Date(existing.completedAt), "EEE d MMM · HH:mm")}
          </span>
        ) : null}
      </div>
    </div>
  );
}
