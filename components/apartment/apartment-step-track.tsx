"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import {
  AlertOctagon,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  APARTMENT_STEP_STATUS_LABELS,
  calcProgressPercent,
  formatStepDeadline,
  isStepDeadlineOverdue,
} from "@/lib/apartment/apartment-utils";
import { cn } from "@/lib/utils";
import { useApartmentStore } from "@/stores/apartment-store";
import type {
  ApartmentProgressStep,
  ApartmentStepKind,
  ApartmentStepStatus,
} from "@/types/apartment";

const STATUS_OPTIONS: ApartmentStepStatus[] = [
  "todo",
  "current",
  "done",
  "blocked",
];

export function StepIcon({
  status,
  waitingTestId,
}: {
  status: ApartmentStepStatus;
  waitingTestId?: boolean;
}) {
  switch (status) {
    case "done":
      return (
        <CheckCircle2
          className="size-5 text-emerald-600 dark:text-emerald-400"
          aria-label="Done"
        />
      );
    case "current":
      return (
        <Clock
          className="size-5 text-primary"
          aria-label="Waiting"
          {...(waitingTestId ? { "data-testid": "step-waiting-icon" } : {})}
        />
      );
    case "blocked":
      return (
        <AlertOctagon className="size-5 text-destructive" aria-label="Blocked" />
      );
    default:
      return (
        <Circle
          className="size-5 text-muted-foreground/50"
          aria-label="To do"
        />
      );
  }
}

function StepDetailDialog({
  step,
  kind,
  onClose,
}: {
  step: ApartmentProgressStep | null;
  kind: ApartmentStepKind;
  onClose: () => void;
}) {
  const setStepState = useApartmentStore((state) => state.setStepState);
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  if (step && editingId !== step.id) {
    setEditingId(step.id);
    setDeadline(step.date ?? "");
    setNotes(step.notes ?? "");
  }

  async function applyStatus(status: ApartmentStepStatus) {
    if (!step) {
      return;
    }
    const result = await setStepState(kind, step.id, {
      status,
      date: deadline || null,
      notes: notes || null,
    });
    if (!result.ok) {
      toast.error(result.message);
    }
  }

  async function saveDetails() {
    if (!step) {
      return;
    }
    const result = await setStepState(kind, step.id, {
      status: step.status,
      date: deadline || null,
      notes: notes || null,
    });
    if (!result.ok) {
      toast.error(result.message);
    } else {
      toast.success("Step updated.");
      onClose();
    }
  }

  const deadlineId = `apartment-step-deadline-${kind}`;
  const notesId = `apartment-step-notes-${kind}`;

  return (
    <Dialog open={step !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {step ? (
          <>
            <DialogHeader>
              <DialogTitle>{step.title}</DialogTitle>
              {step.description ? (
                <DialogDescription>{step.description}</DialogDescription>
              ) : null}
            </DialogHeader>

            {step.source ? (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <FileText className="size-3.5" aria-hidden />
                Source: {step.source}
              </p>
            ) : null}

            <div className="flex flex-col gap-2">
              <Label>Status</Label>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={step.status === status ? "default" : "outline"}
                    onClick={() => void applyStatus(status)}
                  >
                    {APARTMENT_STEP_STATUS_LABELS[status]}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor={deadlineId}>Deadline (optional)</Label>
              <Input
                id={deadlineId}
                type="date"
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Target date for this step — shown in the list as Due …
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor={notesId}>Notes (optional)</Label>
              <Textarea
                id={notesId}
                value={notes}
                rows={3}
                placeholder="Anything important about this step…"
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => void saveDetails()}>
                Save
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function ApartmentStepTrack({
  title,
  steps,
  kind,
  compact = false,
  headerExtra,
  waitingTestId = false,
}: {
  title: string;
  steps: ApartmentProgressStep[];
  kind: ApartmentStepKind;
  compact?: boolean;
  headerExtra?: ReactNode;
  /** Expose data-testid on the waiting icon (keys track only). */
  waitingTestId?: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const percent = calcProgressPercent(steps);
  const doneCount = steps.filter((step) => step.status === "done").length;
  const selected = steps.find((step) => step.id === selectedId) ?? null;

  return (
    <Card className={cn(compact && "flex h-full flex-col")}>
      <CardHeader className={cn(compact && "pb-3")}>
        <CardTitle className={cn(compact && "text-base")}>{title}</CardTitle>
        <CardDescription>
          {doneCount} of {steps.length} steps done · {percent}%
        </CardDescription>
      </CardHeader>
      <CardContent className={cn("flex flex-col gap-4", compact && "flex-1")}>
        <Progress value={percent} aria-label={`${title}: ${percent}% complete`} />
        {headerExtra}
        <ol
          className={cn(
            "flex flex-col",
            compact && "max-h-[min(52vh,28rem)] overflow-y-auto pr-1",
          )}
        >
          {steps.map((step, index) => (
            <li key={step.id} className="relative flex gap-3">
              {index < steps.length - 1 ? (
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-6 left-[9px] h-[calc(100%-0.75rem)] w-0.5",
                    step.status === "done"
                      ? "bg-emerald-500/40"
                      : "bg-border",
                  )}
                />
              ) : null}
              <span className="z-10 mt-0.5 shrink-0 bg-card">
                <StepIcon
                  status={step.status}
                  waitingTestId={waitingTestId && step.status === "current"}
                />
              </span>
              <button
                type="button"
                className="group flex min-w-0 flex-1 flex-col items-start pb-4 text-left"
                onClick={() => setSelectedId(step.id)}
              >
                <span
                  className={cn(
                    "text-sm group-hover:underline",
                    step.status === "done" && "text-muted-foreground",
                    step.status === "current" && "font-medium",
                  )}
                >
                  {step.title}
                </span>
                <span className="flex flex-wrap items-center gap-1.5">
                  {step.status === "current" ? (
                    <Badge variant="secondary">Waiting</Badge>
                  ) : null}
                  {step.status === "blocked" ? (
                    <Badge variant="destructive">Blocked</Badge>
                  ) : null}
                  {step.date ? (
                    <Badge
                      variant={
                        isStepDeadlineOverdue(step.date, step.status)
                          ? "destructive"
                          : step.status === "done"
                            ? "outline"
                            : "secondary"
                      }
                      className="gap-1 font-normal"
                    >
                      <CalendarDays className="size-3" aria-hidden />
                      {isStepDeadlineOverdue(step.date, step.status)
                        ? "Overdue"
                        : "Due"}{" "}
                      {formatStepDeadline(step.date)}
                    </Badge>
                  ) : null}
                  {step.notes ? (
                    <span className="max-w-full truncate text-xs text-muted-foreground">
                      {step.notes}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </CardContent>

      <StepDetailDialog
        step={selected}
        kind={kind}
        onClose={() => setSelectedId(null)}
      />
    </Card>
  );
}
