"use client";

import { CalendarDays, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { RehabMarkdown } from "@/components/rehab/rehab-markdown";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/config/routes";
import {
  allSubtasksDone,
  countSubtasksDone,
  isClinicalSubtaskDone,
  parseClinicalTaskBody,
} from "@/lib/rehab/rehab-clinical-task-body";
import {
  clinicalCalendarLabel,
  findClinicalCalendarAnchors,
  rehabUpcomingCalendarHref,
} from "@/lib/rehab/rehab-clinical-utils";
import {
  REHAB_CLINICAL_PHASE_INTRO,
  REHAB_CLINICAL_PHASE_LABELS,
} from "@/modules/rehab/neuro-rehab-2026/clinical-content";
import { cn } from "@/lib/utils";
import { useRehabClinicalStore } from "@/stores/rehab-clinical-store";
import { useRehabPlanStore } from "@/stores/rehab-plan-store";
import type { RehabClinicalItem, RehabClinicalPhase } from "@/types/rehab";

const textareaClassName = cn(
  "border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30",
  "min-h-16 w-full resize-y rounded-lg border px-3 py-2 text-sm leading-relaxed outline-none transition-colors focus-visible:ring-3",
);

function isClinicalItemDone(
  item: RehabClinicalItem,
  subtaskCount: number,
): boolean {
  if (subtaskCount > 0) {
    return allSubtasksDone(item.subtasksDone, subtaskCount);
  }
  return Boolean(item.completedAt);
}

function ClinicalItemNotes({
  itemId,
  notes,
  onSave,
}: {
  itemId: string;
  notes: string;
  onSave: (itemId: string, notes: string) => void;
}) {
  const [draft, setDraft] = useState(notes);

  useEffect(() => {
    setDraft(notes);
  }, [notes]);

  return (
    <div className="space-y-1.5 pt-3">
      <Label htmlFor={`clinical-notes-${itemId}`} className="text-muted-foreground text-xs">
        Notes
      </Label>
      <textarea
        id={`clinical-notes-${itemId}`}
        className={textareaClassName}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          if (draft !== notes) {
            onSave(itemId, draft);
          }
        }}
        placeholder="Results, file names, appointment dates…"
      />
    </div>
  );
}

function ClinicalSubtaskChecklistCard({
  item,
  description,
  subtasks,
  onToggleAllSubtasks,
  onToggleSubtask,
  onSaveNotes,
}: {
  item: RehabClinicalItem;
  description: string;
  subtasks: string[];
  onToggleAllSubtasks: (id: string, completed: boolean, count: number) => void;
  onToggleSubtask: (
    id: string,
    index: number,
    completed: boolean,
    count: number,
  ) => void;
  onSaveNotes: (id: string, notes: string) => void;
}) {
  const total = subtasks.length;
  const doneCount = countSubtasksDone(item.subtasksDone, total);
  const allDone = allSubtasksDone(item.subtasksDone, total);

  return (
    <div className="bg-card border-border rounded-xl border p-3 shadow-sm sm:p-4">
      <div className="flex items-start gap-3">
        <Checkbox
          checked={allDone}
          onCheckedChange={(checked) =>
            onToggleAllSubtasks(item.id, checked === true, total)
          }
          className="mt-0.5 shrink-0 cursor-pointer"
          aria-label={`Mark all subtasks for ${item.title}`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p
              className={cn(
                "min-w-0 flex-1 text-sm font-medium leading-snug",
                allDone && "text-muted-foreground line-through",
              )}
            >
              {item.title}{" "}
              <span className="text-muted-foreground font-normal tabular-nums">
                ({doneCount}/{total})
              </span>
            </p>
            <Badge variant={allDone ? "secondary" : "outline"} className="shrink-0">
              {allDone ? "Done" : "To do"}
            </Badge>
          </div>

          {description ? (
            <div className="text-muted-foreground pt-2 text-sm leading-relaxed">
              <RehabMarkdown content={description} />
            </div>
          ) : null}

          <ul className="mt-3 space-y-2">
            {subtasks.map((subtask, index) => {
              const subDone = isClinicalSubtaskDone(item.subtasksDone, index);
              return (
                <li key={`${item.id}-${index}`} className="flex items-start gap-3">
                  <Checkbox
                    checked={subDone}
                    onCheckedChange={(checked) =>
                      onToggleSubtask(item.id, index, checked === true, total)
                    }
                    className="mt-0.5 shrink-0 cursor-pointer"
                    aria-label={`Mark ${subtask} complete`}
                  />
                  <span
                    className={cn(
                      "min-w-0 flex-1 text-sm leading-snug",
                      subDone && "text-muted-foreground line-through",
                    )}
                  >
                    {subtask}
                  </span>
                </li>
              );
            })}
          </ul>

          <ClinicalItemNotes
            itemId={item.id}
            notes={item.notes}
            onSave={onSaveNotes}
          />
        </div>
      </div>
    </div>
  );
}

function ClinicalSimpleTaskCard({
  item,
  onToggleCompleted,
  onSaveNotes,
}: {
  item: RehabClinicalItem;
  onToggleCompleted: (id: string, completed: boolean) => void;
  onSaveNotes: (id: string, notes: string) => void;
}) {
  const completed = Boolean(item.completedAt);
  const { description } = useMemo(
    () => parseClinicalTaskBody(item.body),
    [item.body],
  );
  const bodyText = description || item.body.trim();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-card border-border rounded-xl border p-3 shadow-sm sm:p-4">
      <div className="flex items-start gap-3">
        <Checkbox
          checked={completed}
          onCheckedChange={(checked) =>
            onToggleCompleted(item.id, checked === true)
          }
          className="mt-0.5 shrink-0 cursor-pointer"
          aria-label={`Mark ${item.title} complete`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p
              className={cn(
                "min-w-0 flex-1 text-sm font-medium leading-snug",
                completed && "text-muted-foreground line-through",
              )}
            >
              {item.title}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <Badge variant={completed ? "secondary" : "outline"}>
                {completed ? "Done" : "To do"}
              </Badge>
              {bodyText || item.notes ? (
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground cursor-pointer rounded-md p-0.5"
                  aria-expanded={expanded}
                  aria-label="Toggle details"
                  onClick={() => setExpanded((value) => !value)}
                >
                  <ChevronDown
                    className={cn(
                      "size-4 transition-transform",
                      !expanded && "-rotate-90",
                    )}
                  />
                </button>
              ) : null}
            </div>
          </div>

          {expanded && bodyText ? (
            <div className="text-muted-foreground pt-2 text-sm leading-relaxed">
              <RehabMarkdown content={bodyText} />
            </div>
          ) : null}

          {expanded ? (
            <ClinicalItemNotes
              itemId={item.id}
              notes={item.notes}
              onSave={onSaveNotes}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ClinicalTaskCard({
  item,
  onToggleCompleted,
  onToggleSubtask,
  onToggleAllSubtasks,
  onSaveNotes,
}: {
  item: RehabClinicalItem;
  onToggleCompleted: (id: string, completed: boolean) => void;
  onToggleSubtask: (
    id: string,
    index: number,
    completed: boolean,
    count: number,
  ) => void;
  onToggleAllSubtasks: (id: string, completed: boolean, count: number) => void;
  onSaveNotes: (id: string, notes: string) => void;
}) {
  const { description, subtasks } = useMemo(
    () => parseClinicalTaskBody(item.body),
    [item.body],
  );

  if (subtasks.length > 0) {
    return (
      <ClinicalSubtaskChecklistCard
        item={item}
        description={description}
        subtasks={subtasks}
        onToggleAllSubtasks={onToggleAllSubtasks}
        onToggleSubtask={onToggleSubtask}
        onSaveNotes={onSaveNotes}
      />
    );
  }

  return (
    <ClinicalSimpleTaskCard
      item={item}
      onToggleCompleted={onToggleCompleted}
      onSaveNotes={onSaveNotes}
    />
  );
}

function ClinicalPhaseSection({
  phase,
  items,
  calendarHref,
  calendarLabel,
  expanded,
  onToggle,
  onToggleCompleted,
  onToggleSubtask,
  onToggleAllSubtasks,
  onSaveNotes,
}: {
  phase: RehabClinicalPhase;
  items: RehabClinicalItem[];
  calendarHref: string | null;
  calendarLabel: string | null;
  expanded: boolean;
  onToggle: () => void;
  onToggleCompleted: (id: string, completed: boolean) => void;
  onToggleSubtask: (
    id: string,
    index: number,
    completed: boolean,
    count: number,
  ) => void;
  onToggleAllSubtasks: (id: string, completed: boolean, count: number) => void;
  onSaveNotes: (id: string, notes: string) => void;
}) {
  const doneCount = items.filter((item) => {
    const { subtasks } = parseClinicalTaskBody(item.body);
    return isClinicalItemDone(item, subtasks.length);
  }).length;

  return (
    <section className="space-y-2">
      <button
        type="button"
        className="hover:bg-muted/40 flex w-full cursor-pointer items-start justify-between gap-3 rounded-lg px-1 py-2 text-left transition-colors"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">{REHAB_CLINICAL_PHASE_LABELS[phase]}</h2>
          <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
            {REHAB_CLINICAL_PHASE_INTRO[phase]}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {doneCount} of {items.length} done
          </p>
        </div>
        <ChevronDown
          className={cn(
            "text-muted-foreground mt-1 size-4 shrink-0 transition-transform",
            !expanded && "-rotate-90",
          )}
        />
      </button>

      {expanded ? (
        <div className="space-y-3 pb-2">
          {calendarHref && calendarLabel ? (
            <Link
              href={calendarHref}
              className="text-primary hover:text-primary/80 inline-flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs font-medium transition-colors"
            >
              <CalendarDays className="size-3.5" />
              On calendar: {calendarLabel}
            </Link>
          ) : null}

          {items.map((item) => (
            <ClinicalTaskCard
              key={item.id}
              item={item}
              onToggleCompleted={onToggleCompleted}
              onToggleSubtask={onToggleSubtask}
              onToggleAllSubtasks={onToggleAllSubtasks}
              onSaveNotes={onSaveNotes}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function RehabClinicalView() {
  const items = useRehabClinicalStore((state) => state.items);
  const toggleCompleted = useRehabClinicalStore((state) => state.toggleCompleted);
  const toggleSubtask = useRehabClinicalStore((state) => state.toggleSubtask);
  const toggleAllSubtasks = useRehabClinicalStore((state) => state.toggleAllSubtasks);
  const updateNotes = useRehabClinicalStore((state) => state.updateNotes);
  const ensurePlanLoaded = useRehabPlanStore((state) => state.ensureLoaded);
  const events = useRehabPlanStore((state) => state.events);

  useEffect(() => {
    void ensurePlanLoaded();
  }, [ensurePlanLoaded]);

  const [expandedPhases, setExpandedPhases] = useState<Set<RehabClinicalPhase>>(
    () => new Set(),
  );

  const byPhase = useMemo(() => {
    const before = items
      .filter((item) => item.phase === "before")
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const after = items
      .filter((item) => item.phase === "after")
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return { before, after };
  }, [items]);

  const { day0, finalRetest } = useMemo(
    () => findClinicalCalendarAnchors(events),
    [events],
  );

  const togglePhase = useCallback((phase: RehabClinicalPhase) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phase)) {
        next.delete(phase);
      } else {
        next.add(phase);
      }
      return next;
    });
  }, []);

  const handleToggleCompleted = useCallback(
    (itemId: string, completed: boolean) => {
      void toggleCompleted(itemId, completed);
    },
    [toggleCompleted],
  );

  const handleSaveNotes = useCallback(
    (itemId: string, notes: string) => {
      void updateNotes(itemId, notes);
    },
    [updateNotes],
  );

  const handleToggleSubtask = useCallback(
    (itemId: string, index: number, completed: boolean, count: number) => {
      void toggleSubtask(itemId, index, completed, count);
    },
    [toggleSubtask],
  );

  const handleToggleAllSubtasks = useCallback(
    (itemId: string, completed: boolean, count: number) => {
      void toggleAllSubtasks(itemId, completed, count);
    },
    [toggleAllSubtasks],
  );

  const countDone = useCallback((list: RehabClinicalItem[]) => {
    return list.filter((item) => {
      const { subtasks } = parseClinicalTaskBody(item.body);
      return isClinicalItemDone(item, subtasks.length);
    }).length;
  }, []);

  const totalDone = countDone(byPhase.before) + countDone(byPhase.after);
  const totalCount = byPhase.before.length + byPhase.after.length;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="border-border shrink-0 space-y-2 border-b px-4 py-4 md:px-6">
        <h1 className="font-heading text-xl font-semibold tracking-tight">Clinical</h1>
        <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
          Baseline before rehab, repeat at the end — so you can compare. Daily habits
          stay on <Link href={ROUTES.rehabToday} className="text-primary underline-offset-4 hover:underline">Today</Link>
          ; schedule on{" "}
          <Link href={ROUTES.rehabPlan} className="text-primary underline-offset-4 hover:underline">Upcoming</Link>.
        </p>
        <p className="text-muted-foreground text-xs">
          {totalDone} of {totalCount} done
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4 md:px-6">
        <ClinicalPhaseSection
          phase="before"
          items={byPhase.before}
          calendarHref={day0 ? rehabUpcomingCalendarHref(day0.startAt) : null}
          calendarLabel={day0 ? clinicalCalendarLabel(day0) : null}
          expanded={expandedPhases.has("before")}
          onToggle={() => togglePhase("before")}
          onToggleCompleted={handleToggleCompleted}
          onToggleSubtask={handleToggleSubtask}
          onToggleAllSubtasks={handleToggleAllSubtasks}
          onSaveNotes={handleSaveNotes}
        />

        <ClinicalPhaseSection
          phase="after"
          items={byPhase.after}
          calendarHref={
            finalRetest ? rehabUpcomingCalendarHref(finalRetest.startAt) : null
          }
          calendarLabel={finalRetest ? clinicalCalendarLabel(finalRetest) : null}
          expanded={expandedPhases.has("after")}
          onToggle={() => togglePhase("after")}
          onToggleCompleted={handleToggleCompleted}
          onToggleSubtask={handleToggleSubtask}
          onToggleAllSubtasks={handleToggleAllSubtasks}
          onSaveNotes={handleSaveNotes}
        />
      </div>
    </div>
  );
}
