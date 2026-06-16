"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

import { EventFormPage } from "@/components/calendar/event-form-dialog";
import { RehabStoicPage } from "@/components/rehab/rehab-stoic-page";
import {
  rehabEventReturnHref,
  type RehabEventReturnTo,
} from "@/config/routes";
import { resolveRehabPlanEventById } from "@/lib/rehab/resolve-rehab-plan-event";
import { isStoicEvent } from "@/lib/rehab/stoic-response";
import {
  selectRehabPlanReady,
  useRehabPlanStore,
} from "@/stores/rehab-plan-store";

type RehabEventPageViewProps = {
  eventId: string;
  returnTo: RehabEventReturnTo | null;
};

export function RehabEventPageView({
  eventId,
  returnTo,
}: RehabEventPageViewProps) {
  const router = useRouter();
  const ensureLoaded = useRehabPlanStore((state) => state.ensureLoaded);
  const ready = useRehabPlanStore(selectRehabPlanReady);
  const loading = useRehabPlanStore((state) => state.loading);
  const allEvents = useRehabPlanStore((state) => state.events);
  const persistence = useRehabPlanStore((state) => state.persistence);
  const backHref = rehabEventReturnHref(returnTo);

  useEffect(() => {
    void ensureLoaded();
  }, [ensureLoaded]);

  const event = useMemo(
    () => resolveRehabPlanEventById(allEvents, eventId),
    [allEvents, eventId],
  );

  if (!event && !ready && loading) {
    return (
      <div
        className="flex min-h-0 flex-1 flex-col overflow-x-hidden px-4 py-6 md:px-6"
        role="status"
        aria-label="Loading task"
      >
        <div className="bg-muted mb-4 h-8 w-20 animate-pulse rounded-md" />
        <div className="bg-muted h-40 animate-pulse rounded-lg" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden px-4 py-6 md:px-6">
        <div className="mb-4">
          <Link
            href={backHref}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back
          </Link>
        </div>
        <p className="text-muted-foreground text-sm">Task not found.</p>
      </div>
    );
  }

  const onClose = () => router.push(backHref);

  if (isStoicEvent(event)) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-x-hidden">
        <div className="border-border shrink-0 border-b px-4 py-3 md:px-6">
          <Link
            href={backHref}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back
          </Link>
        </div>
        <RehabStoicPage event={event} onClose={onClose} />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-x-hidden">
      <div className="border-border shrink-0 border-b px-4 py-3 md:px-6">
        <Link
          href={backHref}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back
        </Link>
      </div>
      <EventFormPage
        event={event}
        defaultStart={new Date(event.startAt)}
        defaultAllDay={event.allDay}
        persistence={persistence}
        variant="rehab"
        onSaved={onClose}
        onDeleted={onClose}
        onClose={onClose}
      />
    </div>
  );
}
