"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { RehabStoicPage } from "@/components/rehab/rehab-stoic-page";
import { format } from "date-fns";
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
        <DialogContent
          showCloseButton={false}
          className="flex max-h-[min(90vh,46rem)] flex-col overflow-hidden border-white/10 bg-[#1f1f1f] p-0 text-white shadow-2xl sm:max-w-md"
        >
          <DialogTitle className="sr-only">
            {event.title} — {format(new Date(event.startAt), "EEE d MMM yyyy")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Log your Stoic practice with quick Yes / Partial / No answers and an
            optional note, and review past entries.
          </DialogDescription>
          <RehabStoicPage
            key={event.id}
            event={event}
            onClose={() => onOpenChange(false)}
          />
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
