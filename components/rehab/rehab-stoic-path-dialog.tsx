"use client";

import { format } from "date-fns";

import { RehabStoicPathDailyPanel } from "@/components/rehab/rehab-stoic-path-daily-panel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getStoicExerciseById,
  getStoicExerciseForDate,
  STOIC_PATH_PLAN_KIND_LABEL,
} from "@/lib/rehab/stoic-rehab-utils";
import { PROGRAM_START } from "@/modules/rehab/neuro-rehab-2026/constants";

type RehabStoicPathDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date?: Date;
  exerciseId?: string;
};

export function RehabStoicPathDialog({
  open,
  onOpenChange,
  date = new Date(),
  exerciseId,
}: RehabStoicPathDialogProps) {
  const exercise =
    (exerciseId ? getStoicExerciseById(exerciseId) : null) ??
    getStoicExerciseForDate(PROGRAM_START, date, "morning");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <DialogContent
          showCloseButton
          className="flex max-h-[min(90vh,46rem)] flex-col overflow-hidden sm:max-w-lg"
        >
          <DialogTitle className="sr-only">
            {STOIC_PATH_PLAN_KIND_LABEL}: {exercise.title} —{" "}
            {format(date, "EEE d MMM yyyy")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Daily Stoic attention and values practice for rehab consistency. Not
            medical treatment.
          </DialogDescription>
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <RehabStoicPathDailyPanel
              date={date}
              exerciseId={exercise.id}
              onSaved={() => onOpenChange(false)}
            />
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
