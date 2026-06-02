"use client";

import type { ReactNode } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { TodoSubtask } from "@/types/todo";

type ChecklistHoverPreviewProps = {
  subtasks: TodoSubtask[];
  doneCount: number;
  children: ReactNode;
  className?: string;
};

export function ChecklistHoverPreview({
  subtasks,
  doneCount,
  children,
  className,
}: ChecklistHoverPreviewProps) {
  if (subtasks.length === 0) {
    return <>{children}</>;
  }

  return (
    <Tooltip>
      <TooltipTrigger
        className={cn(
          "inline-flex cursor-default items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          className,
        )}
        render={<span tabIndex={0} />}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={8}
        align="end"
        className="border-border bg-card text-card-foreground max-w-none px-0 py-0 shadow-xl"
      >
        <div className="w-[min(85vw,280px)] px-3 py-2.5">
          <p className="text-foreground mb-2 text-xs font-semibold">
            Checklist
            <span className="text-muted-foreground ml-1.5 font-medium tabular-nums">
              {doneCount}/{subtasks.length}
            </span>
          </p>
          <ul className="max-h-[min(50vh,220px)] space-y-1.5 overflow-y-auto">
            {subtasks.map((subtask) => (
              <li
                key={subtask.id}
                className="flex items-start gap-2 text-[13px] leading-snug"
              >
                <span
                  className={cn(
                    "border-input mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded border",
                    subtask.done &&
                      "bg-primary border-primary text-primary-foreground",
                  )}
                  aria-hidden
                >
                  {subtask.done ? (
                    <svg
                      viewBox="0 0 16 16"
                      className="size-3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
                    </svg>
                  ) : null}
                </span>
                <span
                  className={cn(
                    "min-w-0 flex-1",
                    subtask.done && "text-muted-foreground line-through",
                  )}
                >
                  {subtask.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
