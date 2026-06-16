"use client";

import { format } from "date-fns";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  calendarEventActionsFor,
  type CalendarClientVariant,
} from "@/lib/calendar/calendar-event-actions";
import {
  JOURNAL_NOTES_HELPER,
  JOURNAL_RATING_FIELDS,
  normalizeJournalNotes,
  parseJournalDescription,
  REHAB_DONE_VALUES,
  serializeJournalDescription,
  type JournalRatingKey,
  type RehabDoneValue,
} from "@/lib/rehab/journal-entry";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types/calendar";

type RehabJournalDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
  persistence: boolean;
  variant?: CalendarClientVariant;
  onSaved: (event: CalendarEvent) => void;
};

const REHAB_DONE_LABELS: Record<RehabDoneValue, string> = {
  yes: "Yes",
  partial: "Partial",
  no: "No",
};

export function RehabJournalDialog({
  open,
  onOpenChange,
  event,
  persistence,
  variant = "rehab",
  onSaved,
}: RehabJournalDialogProps) {
  const closeRequestRef = useRef<(() => void | Promise<void>) | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          onOpenChange(true);
          return;
        }
        void closeRequestRef.current?.();
      }}
    >
      {open && event ? (
        <RehabJournalDialogBody
          key={event.id}
          closeRequestRef={closeRequestRef}
          event={event}
          persistence={persistence}
          variant={variant}
          onOpenChange={onOpenChange}
          onSaved={onSaved}
        />
      ) : null}
    </Dialog>
  );
}

function RehabJournalDialogBody({
  closeRequestRef,
  event,
  persistence,
  variant = "rehab",
  onOpenChange,
  onSaved,
}: {
  closeRequestRef: React.MutableRefObject<(() => void | Promise<void>) | null>;
  event: CalendarEvent;
  persistence: boolean;
  variant?: CalendarClientVariant;
  onOpenChange: (open: boolean) => void;
  onSaved: (event: CalendarEvent) => void;
}) {
  const actions = calendarEventActionsFor(variant);
  const initial = parseJournalDescription(event.description);

  const [ratings, setRatings] = useState(initial.ratings);
  const [rehabDone, setRehabDone] = useState<RehabDoneValue | null>(
    initial.rehabDone,
  );
  const [notes, setNotes] = useState(() => normalizeJournalNotes(initial.notes));
  const [pending, setPending] = useState(false);

  const dateLabel = format(new Date(event.startAt), "yyyy-MM-dd");

  function setRating(key: JournalRatingKey, value: number) {
    setRatings((prev) => {
      const next = { ...prev };
      if (next[key] === value) {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  }

  async function handleSave() {
    if (pending) {
      return;
    }
    const description = serializeJournalDescription({ ratings, rehabDone, notes });
    const updatedAt = new Date().toISOString();

    if (!persistence) {
      onSaved({ ...event, description, updatedAt });
      onOpenChange(false);
      toast.success("Journal saved.");
      return;
    }

    setPending(true);
    try {
      const result = await actions.update({ id: event.id, description });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      onSaved({ ...event, description, updatedAt });
      toast.success("Journal saved.");
      onOpenChange(false);
    } finally {
      setPending(false);
    }
  }

  useEffect(() => {
    closeRequestRef.current = handleSave;
  });

  return (
    <DialogContent
      showCloseButton={false}
      className="flex max-h-[min(90vh,44rem)] flex-col overflow-hidden border-white/10 bg-[#1f1f1f] p-0 text-white shadow-2xl sm:max-w-md"
    >
      <DialogTitle className="sr-only">Journal — {dateLabel}</DialogTitle>
      <DialogDescription className="sr-only">
        Daily rehab ratings and notes.
      </DialogDescription>

      <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-5 py-4">
        <h2 className="text-base font-semibold text-white">Journal — {dateLabel}</h2>
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
        <p className="text-xs font-medium tracking-wide text-white/40 uppercase">
          Rate 0–10
        </p>

        <div className="space-y-4">
          {JOURNAL_RATING_FIELDS.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <span className="text-sm text-white/75">{field.label}</span>
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: 11 }, (_, score) => {
                  const selected = ratings[field.key] === score;
                  return (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setRating(field.key, score)}
                      aria-pressed={selected}
                      aria-label={`${field.label}: ${score}`}
                      className={cn(
                        "flex size-7 items-center justify-center rounded-md text-xs tabular-nums transition-colors",
                        selected
                          ? "bg-white font-semibold text-black"
                          : "bg-white/8 text-white/65 hover:bg-white/15 hover:text-white",
                      )}
                    >
                      {score}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() =>
                    setRatings((prev) => {
                      const next = { ...prev };
                      delete next[field.key];
                      return next;
                    })
                  }
                  aria-pressed={!(field.key in ratings)}
                  aria-label={`${field.label}: no score`}
                  className={cn(
                    "flex size-7 items-center justify-center rounded-md text-xs transition-colors",
                    !(field.key in ratings)
                      ? "bg-white font-semibold text-black"
                      : "bg-white/8 text-white/65 hover:bg-white/15 hover:text-white",
                  )}
                >
                  –
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          <span className="text-sm text-white/75">Rehab done</span>
          <div className="flex gap-1.5">
            {REHAB_DONE_VALUES.map((value) => {
              const selected = rehabDone === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setRehabDone((prev) => (prev === value ? null : value))
                  }
                  aria-pressed={selected}
                  className={cn(
                    "flex-1 rounded-md px-3 py-1.5 text-sm transition-colors",
                    selected
                      ? "bg-white font-semibold text-black"
                      : "bg-white/8 text-white/65 hover:bg-white/15 hover:text-white",
                  )}
                >
                  {REHAB_DONE_LABELS[value]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-sm text-white/75">Notes</span>
          <p className="text-xs leading-relaxed text-white/40">
            {JOURNAL_NOTES_HELPER}
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm leading-relaxed text-white/80 outline-none focus-visible:border-white/25"
          />
        </div>
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
