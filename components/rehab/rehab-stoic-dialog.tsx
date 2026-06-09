"use client";

import { format } from "date-fns";
import { Check, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { RehabMarkdown } from "@/components/rehab/rehab-markdown";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  collectStoicResponseHistory,
  parseStoicResponse,
  serializeStoicResponse,
  STOIC_CHECK_LABELS,
  STOIC_CHECK_VALUES,
  summarizeStoicResponse,
  type StoicCheckValue,
} from "@/lib/rehab/stoic-response";
import { stoicChecksForTitle } from "@/modules/rehab/neuro-rehab-2026/stoic-content";
import { useRehabPlanStore } from "@/stores/rehab-plan-store";
import { cn } from "@/lib/utils";
import type { RehabPlanEvent } from "@/types/rehab";

type RehabStoicDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: RehabPlanEvent | null;
};

export function RehabStoicDialog({
  open,
  onOpenChange,
  event,
}: RehabStoicDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && event ? (
        <RehabStoicDialogBody
          key={event.id}
          event={event}
          onClose={() => onOpenChange(false)}
        />
      ) : null}
    </Dialog>
  );
}

function RehabStoicDialogBody({
  event,
  onClose,
}: {
  event: RehabPlanEvent;
  onClose: () => void;
}) {
  const editSeries = useRehabPlanStore((state) => state.editSeries);
  const allEvents = useRehabPlanStore((state) => state.events);

  const checkItems = useMemo(
    () => stoicChecksForTitle(event.title),
    [event.title],
  );
  const { prompt, data: saved } = useMemo(
    () => parseStoicResponse(event.description),
    [event.description],
  );

  const [checks, setChecks] = useState<Record<string, StoicCheckValue>>(
    saved.checks,
  );
  const [note, setNote] = useState(saved.note);
  const [pending, setPending] = useState(false);

  const currentOccurrenceAt = event.recurrenceAt;
  const history = useMemo(
    () =>
      collectStoicResponseHistory(allEvents, event).filter(
        (entry) => entry.occurrenceAt !== currentOccurrenceAt,
      ),
    [allEvents, event, currentOccurrenceAt],
  );

  const dateLabel = format(new Date(event.startAt), "EEE d MMM yyyy");

  function setCheck(id: string, value: StoicCheckValue) {
    setChecks((prev) => {
      const next = { ...prev };
      if (next[id] === value) {
        delete next[id];
      } else {
        next[id] = value;
      }
      return next;
    });
  }

  async function handleSave() {
    if (pending) {
      return;
    }
    const nextDescription = serializeStoicResponse(prompt, { checks, note });
    const savedDescription = serializeStoicResponse(prompt, saved);
    if (nextDescription === savedDescription) {
      onClose();
      return;
    }

    setPending(true);
    try {
      const result = await editSeries(
        event,
        {
          title: event.title,
          description: nextDescription,
          startAt: event.startAt,
          endAt: event.endAt,
          allDay: event.allDay,
          color: event.color,
        },
        null,
        "occurrence",
      );
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Logged.");
      onClose();
    } finally {
      setPending(false);
    }
  }

  return (
    <DialogContent
      showCloseButton={false}
      className="flex max-h-[min(90vh,46rem)] flex-col overflow-hidden border-white/10 bg-[#1f1f1f] p-0 text-white shadow-2xl sm:max-w-md"
    >
      <DialogTitle className="sr-only">
        {event.title} — {dateLabel}
      </DialogTitle>
      <DialogDescription className="sr-only">
        Log your Stoic practice with quick Yes / Partial / No answers and an
        optional note, and review past entries.
      </DialogDescription>

      <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-5 py-4">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-white">
            {event.title}
          </h2>
          <p className="text-xs text-white/45">{dateLabel}</p>
        </div>
        <button
          type="button"
          onClick={() => void handleSave()}
          className="text-white/45 transition-colors hover:text-white"
          aria-label="Close"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {prompt ? (
          <div className="rounded-lg border border-white/8 bg-white/[0.03] p-3">
            <RehabMarkdown
              content={prompt}
              className="prose-xs prose-invert max-w-none"
            />
          </div>
        ) : null}

        <div className="space-y-3">
          {checkItems.map((item) => (
            <div key={item.id} className="space-y-1.5">
              <span className="text-sm leading-snug text-white/80">
                {item.label}
              </span>
              <div className="flex gap-1.5">
                {STOIC_CHECK_VALUES.map((value) => {
                  const selected = checks[item.id] === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCheck(item.id, value)}
                      aria-pressed={selected}
                      className={cn(
                        "flex-1 rounded-md px-3 py-1.5 text-sm transition-colors",
                        selected
                          ? "bg-white font-semibold text-black"
                          : "bg-white/8 text-white/65 hover:bg-white/15 hover:text-white",
                      )}
                    >
                      {STOIC_CHECK_LABELS[value]}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          <span className="text-sm text-white/75">Note (optional)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Action · Reaction · Lesson, or this week's prompt…"
            className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap text-white/85 outline-none focus-visible:border-white/25"
          />
        </div>

        {history.length > 0 ? (
          <div className="space-y-2">
            <span className="text-xs font-medium tracking-wide text-white/40 uppercase">
              History ({history.length})
            </span>
            <ul className="space-y-2">
              {history.map((entry) => {
                const summary = summarizeStoicResponse(entry.data);
                return (
                  <li
                    key={entry.id}
                    className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-white/55">
                        {format(new Date(entry.occurrenceAt), "EEE d MMM yyyy")}
                      </span>
                      {entry.completed ? (
                        <Check
                          className="size-3.5 text-emerald-400"
                          aria-label="Completed"
                        />
                      ) : null}
                    </div>
                    {summary ? (
                      <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap text-white/75">
                        {summary}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center justify-end border-t border-white/8 px-5 py-3">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={pending}
          className="rounded-lg bg-white/10 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/15 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </DialogContent>
  );
}
