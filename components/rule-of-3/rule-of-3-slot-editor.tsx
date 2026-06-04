"use client";

import { useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ruleOf3ItemStatus } from "@/lib/rule-of-3/rule-of-3-utils";
import { cn } from "@/lib/utils";
import { useRuleOf3Store } from "@/stores/rule-of-3-store";
import type { RuleOf3Slot } from "@/types/rule-of-3";

export function RuleOf3SlotEditor({
  planDate,
  slot,
}: {
  planDate: string;
  slot: RuleOf3Slot;
}) {
  const setItemTitle = useRuleOf3Store((state) => state.setItemTitle);
  const setItemCompleted = useRuleOf3Store((state) => state.setItemCompleted);
  const setItemBlockedReason = useRuleOf3Store(
    (state) => state.setItemBlockedReason,
  );

  const { item } = slot;
  const status = ruleOf3ItemStatus(item);
  const completed = status === "done";
  const blocked = status === "blocked";

  const [titleDraft, setTitleDraft] = useState<string | null>(null);
  const titleValue = titleDraft ?? item?.title ?? "";

  const [reasonOpen, setReasonOpen] = useState(blocked);
  const [reasonDraft, setReasonDraft] = useState<string | null>(null);
  const reasonValue = reasonDraft ?? item?.blockedReason ?? "";

  function commitTitle() {
    if (titleDraft === null) {
      return;
    }
    const next = titleDraft.trim();
    if (next !== (item?.title ?? "")) {
      void setItemTitle(planDate, slot.position, next);
    }
    setTitleDraft(null);
  }

  function commitReason() {
    if (reasonDraft === null) {
      return;
    }
    const next = reasonDraft.trim();
    if (next !== (item?.blockedReason ?? "")) {
      void setItemBlockedReason(planDate, slot.position, next);
    }
    setReasonDraft(null);
  }

  const hasTitle = (item?.title ?? "").trim().length > 0;

  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-muted/15 p-3.5",
        completed && "border-emerald-500/30 bg-emerald-500/5",
        blocked && "border-amber-500/30 bg-amber-500/5",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
          {slot.position}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {slot.label}
            </span>
            {hasTitle ? (
              <Checkbox
                checked={completed}
                onCheckedChange={(value) =>
                  void setItemCompleted(planDate, slot.position, Boolean(value))
                }
                className="rounded-full"
                aria-label={`Mark "${item?.title}" ${completed ? "not done" : "done"}`}
              />
            ) : null}
          </div>
          <Input
            value={titleValue}
            placeholder={slot.hint}
            onChange={(event) => setTitleDraft(event.target.value)}
            onBlur={commitTitle}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.currentTarget.blur();
              }
            }}
            className={cn(
              "h-9 border-transparent bg-transparent px-0 text-sm font-medium shadow-none focus-visible:border-input focus-visible:bg-background focus-visible:px-2.5",
              completed && "text-muted-foreground line-through",
            )}
            aria-label={`${slot.label} priority`}
          />

          {hasTitle ? (
            <div className="pt-1">
              {reasonOpen || blocked ? (
                <div className="space-y-1.5">
                  <Textarea
                    value={reasonValue}
                    placeholder="Why can't this be covered today?"
                    onChange={(event) => setReasonDraft(event.target.value)}
                    onBlur={commitReason}
                    rows={2}
                    className="text-sm"
                    aria-label="Reason not covered"
                  />
                  <button
                    type="button"
                    className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    onClick={() => {
                      setReasonDraft("");
                      void setItemBlockedReason(planDate, slot.position, "");
                      setReasonOpen(false);
                    }}
                  >
                    Clear reason
                  </button>
                </div>
              ) : (
                !completed && (
                  <button
                    type="button"
                    className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    onClick={() => setReasonOpen(true)}
                  >
                    Can&apos;t cover today?
                  </button>
                )
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
