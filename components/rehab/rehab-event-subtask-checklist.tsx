"use client";

import { ExternalLink } from "lucide-react";
import { useMemo } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import {
  allEventSubtasksDone,
  countEventSubtasksDone,
  groupEventSubtasks,
  resolveEventSubtasks,
} from "@/modules/rehab/neuro-rehab-2026/day0-checklist";
import { cn } from "@/lib/utils";
import type { EventSubtask } from "@/lib/calendar/event-subtasks";
import type { RehabPlanEvent } from "@/types/rehab";

type RehabEventSubtaskChecklistProps = {
  event: RehabPlanEvent;
  onToggleSubtask: (subtasks: EventSubtask[]) => void | Promise<void>;
  onToggleAll: (subtasks: EventSubtask[], completed: boolean) => void | Promise<void>;
  /** When false, rely on the parent row checkbox for mark-all. */
  showMasterCheckbox?: boolean;
  className?: string;
};

export function RehabEventSubtaskChecklist({
  event,
  onToggleSubtask,
  onToggleAll,
  showMasterCheckbox = true,
  className,
}: RehabEventSubtaskChecklistProps) {
  const { subtasks } = useMemo(() => resolveEventSubtasks(event), [event]);
  const groups = useMemo(
    () => groupEventSubtasks(subtasks, event.eventKind),
    [subtasks, event.eventKind],
  );

  if (subtasks.length === 0) {
    return null;
  }

  const doneCount = countEventSubtasksDone(subtasks);
  const allDone = allEventSubtasksDone(subtasks);

  function updateSubtask(id: string, done: boolean) {
    const next = subtasks.map((item) =>
      item.id === id ? { ...item, done } : item,
    );
    void onToggleSubtask(next);
  }

  function updateAll(done: boolean) {
    const next = subtasks.map((item) => ({ ...item, done }));
    void onToggleAll(next, done);
  }

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-muted-foreground text-xs tabular-nums">
        {showMasterCheckbox ? (
          <span className="inline-flex items-center gap-2">
            <Checkbox
              checked={allDone}
              onCheckedChange={(value) => updateAll(Boolean(value))}
              className="shrink-0 cursor-pointer"
              aria-label={`Mark all ${event.title} checklist items complete`}
            />
            <span>
              {doneCount} of {subtasks.length} done
            </span>
          </span>
        ) : (
          <span>
            {doneCount} of {subtasks.length} done
          </span>
        )}
      </p>

      {groups.map((group) => (
        <div key={group.label ?? "default"} className="space-y-2">
          {group.label ? (
            <p className="text-muted-foreground text-xs font-medium">{group.label}</p>
          ) : null}
          <ul className="space-y-2">
            {group.items.map((subtask) => (
              <li key={subtask.id} className="flex items-start gap-3">
                <Checkbox
                  checked={subtask.done}
                  onCheckedChange={(value) => updateSubtask(subtask.id, Boolean(value))}
                  className="mt-0.5 shrink-0 cursor-pointer"
                  aria-label={`Mark ${subtask.label} complete`}
                />
                <span
                  className={cn(
                    "min-w-0 flex-1 text-sm leading-snug",
                    subtask.done && "text-muted-foreground line-through",
                  )}
                >
                  {subtask.label}
                </span>
                {subtask.referenceUrl ? (
                  <a
                    href={subtask.referenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                    aria-label={`Open reference for ${subtask.label}`}
                  >
                    {subtask.referenceLabel ?? "Link"}
                    <ExternalLink className="size-3" aria-hidden />
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
