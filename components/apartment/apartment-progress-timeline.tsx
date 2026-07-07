"use client";

import { useState } from "react";
import {
  AlertOctagon,
  CheckCircle2,
  Circle,
  FileText,
  Loader2,
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
} from "@/lib/apartment/apartment-utils";
import { cn } from "@/lib/utils";
import { useApartmentStore } from "@/stores/apartment-store";
import type {
  ApartmentProgressStep,
  ApartmentStepStatus,
} from "@/types/apartment";

const STATUS_OPTIONS: ApartmentStepStatus[] = [
  "todo",
  "current",
  "done",
  "blocked",
];

function StepIcon({ status }: { status: ApartmentStepStatus }) {
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
        <Loader2
          className="size-5 animate-spin text-primary"
          aria-label="Waiting"
          data-testid="step-waiting-icon"
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

export function ApartmentProgressTimeline() {
  const steps = useApartmentStore((state) => state.progressSteps);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const percent = calcProgressPercent(steps);
  const doneCount = steps.filter((step) => step.status === "done").length;
  const selected = steps.find((step) => step.id === selectedId) ?? null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress to keys</CardTitle>
        <CardDescription>
          {doneCount} of {steps.length} steps done · {percent}%
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Progress value={percent} aria-label={`${percent}% complete`} />

        <ol className="flex flex-col">
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
                <StepIcon status={step.status} />
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
                    <span className="text-xs text-muted-foreground">
                      {step.date}
                    </span>
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
        onClose={() => setSelectedId(null)}
      />
    </Card>
  );
}

function StepDetailDialog({
  step,
  onClose,
}: {
  step: ApartmentProgressStep | null;
  onClose: () => void;
}) {
  const setStepState = useApartmentStore((state) => state.setStepState);
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  if (step && editingId !== step.id) {
    setEditingId(step.id);
    setDate(step.date ?? "");
    setNotes(step.notes ?? "");
  }

  async function applyStatus(status: ApartmentStepStatus) {
    if (!step) {
      return;
    }
    const result = await setStepState("progress", step.id, {
      status,
      date: date || null,
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
    const result = await setStepState("progress", step.id, {
      status: step.status,
      date: date || null,
      notes: notes || null,
    });
    if (!result.ok) {
      toast.error(result.message);
    } else {
      toast.success("Step updated.");
      onClose();
    }
  }

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
              <Label htmlFor="apartment-step-date">Date (optional)</Label>
              <Input
                id="apartment-step-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="apartment-step-notes">Notes (optional)</Label>
              <Textarea
                id="apartment-step-notes"
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
