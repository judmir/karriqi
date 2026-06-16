"use client";

import { endOfDay, format, isBefore, parseISO, startOfDay, subDays } from "date-fns";
import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { EventFormDialog } from "@/components/calendar/event-form-dialog";
import { RehabEventKindIcon } from "@/components/rehab/rehab-event-kind-icon";
import { RehabJournalDialog } from "@/components/rehab/rehab-journal-dialog";
import { RehabMarkdown } from "@/components/rehab/rehab-markdown";
import { RehabStoicDialog } from "@/components/rehab/rehab-stoic-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getEventDescriptionPlainText,
  parseEventDescription,
} from "@/lib/calendar/event-subtasks";
import { expandRehabEvents } from "@/lib/rehab/expand-rehab-events";
import { loadRehabArchivedEventsAction } from "@/lib/rehab/rehab-history-actions";
import {
  buildHistoryDaySections,
  hasMoreHistoryDays,
  historyEventTimeLabel,
  HISTORY_INITIAL_DAYS,
  nextHistoryVisibleDays,
} from "@/lib/rehab/rehab-history-utils";
import {
  getStoicResponseData,
  isStoicEvent,
  summarizeStoicResponse,
} from "@/lib/rehab/stoic-response";
import { PROGRAM_START } from "@/modules/rehab/neuro-rehab-2026/constants";
import { useRehabPlanStore } from "@/stores/rehab-plan-store";
import { cn } from "@/lib/utils";
import type { RehabArchivedEvent, RehabPlanEvent } from "@/types/rehab";

export function RehabHistoryView() {
  const allEvents = useRehabPlanStore((state) => state.events);
  const persistence = useRehabPlanStore((state) => state.persistence);
  const toggleOccurrenceCompleted = useRehabPlanStore(
    (state) => state.toggleOccurrenceCompleted,
  );

  const [visibleDays, setVisibleDays] = useState(HISTORY_INITIAL_DAYS);
  const [archived, setArchived] = useState<RehabArchivedEvent[]>([]);
  const [archivedLoading, setArchivedLoading] = useState(true);
  const [archivedCollapsed, setArchivedCollapsed] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<RehabPlanEvent | null>(
    null,
  );
  const [journalOpen, setJournalOpen] = useState(false);
  const [journalEvent, setJournalEvent] = useState<RehabPlanEvent | null>(null);
  const [stoicOpen, setStoicOpen] = useState(false);
  const [stoicEvent, setStoicEvent] = useState<RehabPlanEvent | null>(null);
  const [draftStart, setDraftStart] = useState(() => new Date());
  const [draftAllDay, setDraftAllDay] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadRehabArchivedEventsAction().then((result) => {
      if (cancelled) {
        return;
      }
      if (result.ok) {
        setArchived(result.events);
      }
      setArchivedLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const expandedEvents = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const windowEnd = endOfDay(subDays(today, 1));
    const programStart = startOfDay(PROGRAM_START);

    if (windowEnd < programStart) {
      return [];
    }

    const oldestDay = subDays(today, visibleDays);
    const windowStart = isBefore(oldestDay, programStart)
      ? programStart
      : startOfDay(oldestDay);

    return expandRehabEvents(allEvents, windowStart, windowEnd, {
      overdueLookbackDays: visibleDays + 30,
    });
  }, [allEvents, visibleDays]);

  const sections = useMemo(
    () => buildHistoryDaySections(expandedEvents, new Date(), visibleDays),
    [expandedEvents, visibleDays],
  );

  const canLoadEarlier = hasMoreHistoryDays(visibleDays);

  const openEdit = useCallback((event: RehabPlanEvent) => {
    if (event.eventKind === "journal") {
      setJournalEvent(event);
      setJournalOpen(true);
      return;
    }
    if (isStoicEvent(event)) {
      setStoicEvent(event);
      setStoicOpen(true);
      return;
    }
    setSelectedEvent(event);
    setDraftAllDay(event.allDay);
    setDraftStart(new Date(event.startAt));
    setDialogOpen(true);
  }, []);

  async function handleToggleCompleted(
    event: RehabPlanEvent,
    completed: boolean,
  ) {
    await toggleOccurrenceCompleted(event, completed);
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="border-border shrink-0 border-b px-4 py-3 md:px-6">
        <h1 className="text-lg font-semibold tracking-tight">History</h1>
        <p className="text-muted-foreground mt-1 text-sm leading-snug">
          Past days with your completions, notes, and details. Removed tasks
          appear under Archived.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 md:px-6">
        {sections.length === 0 ? (
          <p className="text-muted-foreground py-8 text-sm">
            No past rehab activity in this window yet. Complete tasks on Today
            or Upcoming — they will show here after the day passes.
          </p>
        ) : (
          sections.map((section) => (
            <section
              key={section.date.toISOString()}
              className="border-border border-t first:border-t-0"
            >
              <div className="flex items-baseline justify-between gap-3 py-4">
                <h2 className="text-foreground text-sm font-medium">
                  {section.label}
                </h2>
                <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                  {section.completedCount}/{section.events.length} done
                </span>
              </div>
              <div className="flex flex-col gap-1 pb-4">
                {section.events.map((event) => (
                  <HistoryEventRow
                    key={event.id}
                    event={event}
                    onToggleCompleted={(completed) =>
                      void handleToggleCompleted(event, completed)
                    }
                    onEdit={() => openEdit(event)}
                  />
                ))}
              </div>
            </section>
          ))
        )}

        {canLoadEarlier ? (
          <div className="border-border border-t py-4">
            <button
              type="button"
              onClick={() =>
                setVisibleDays((current) => nextHistoryVisibleDays(current))
              }
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              Load earlier days
            </button>
          </div>
        ) : null}

        <ArchivedSection
          events={archived}
          loading={archivedLoading}
          collapsed={archivedCollapsed}
          onToggleCollapse={() => setArchivedCollapsed((value) => !value)}
          onEdit={openEdit}
        />
      </div>

      <EventFormDialog
        open={dialogOpen && selectedEvent !== null}
        onOpenChange={setDialogOpen}
        event={selectedEvent}
        defaultStart={draftStart}
        defaultAllDay={draftAllDay}
        persistence={persistence}
        variant="rehab"
        onSaved={() => setDialogOpen(false)}
        onDeleted={() => setDialogOpen(false)}
      />

      <RehabJournalDialog
        open={journalOpen && journalEvent !== null}
        onOpenChange={setJournalOpen}
        event={journalEvent}
        persistence={persistence}
        variant="rehab"
        onSaved={() => setJournalOpen(false)}
      />

      <RehabStoicDialog
        open={stoicOpen && stoicEvent !== null}
        onOpenChange={setStoicOpen}
        event={stoicEvent}
      />
    </div>
  );
}

function HistoryEventRow({
  event,
  onToggleCompleted,
  onEdit,
  archivedAt,
}: {
  event: RehabPlanEvent;
  onToggleCompleted: (completed: boolean) => void;
  onEdit: () => void;
  archivedAt?: string;
}) {
  const completed = Boolean(event.completedAt);
  const timeLabel = historyEventTimeLabel(event);
  const [expanded, setExpanded] = useState(false);
  const descriptionText = getEventDescriptionPlainText(event.description);
  const myNotes = parseEventDescription(event.description).myNotes.trim();
  const hasDetails = Boolean(descriptionText || myNotes);
  const stoicResponse = isStoicEvent(event)
    ? summarizeStoicResponse(getStoicResponseData(event.description))
    : "";

  return (
    <div className="rounded-lg py-2">
      <div className="flex items-start gap-3">
        <Checkbox
          checked={completed}
          disabled={Boolean(archivedAt)}
          onCheckedChange={(value) => onToggleCompleted(Boolean(value))}
          className="mt-0.5 rounded-full"
          aria-label={`Mark ${event.title} ${completed ? "incomplete" : "complete"}`}
        />
        <RehabEventKindIcon event={event} size="md" className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <button type="button" onClick={onEdit} className="w-full text-left">
            <p
              className={cn(
                "text-sm font-medium leading-snug",
                completed && "text-muted-foreground line-through",
              )}
            >
              {event.title}
            </p>
            {timeLabel ? (
              <p className="text-muted-foreground mt-0.5 text-xs tabular-nums">
                {timeLabel}
              </p>
            ) : null}
            {archivedAt ? (
              <p className="text-muted-foreground mt-0.5 text-xs">
                Removed {format(parseISO(archivedAt), "d MMM yyyy, HH:mm")}
              </p>
            ) : null}
          </button>
          {hasDetails ? (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="text-muted-foreground hover:text-foreground mt-1 text-xs"
            >
              {expanded ? "Hide details" : "Show details"}
            </button>
          ) : null}
          {stoicResponse ? (
            <button
              type="button"
              onClick={onEdit}
              className="mt-1 flex w-full items-start gap-1.5 text-left"
            >
              <span className="text-muted-foreground/80 mt-px text-xs">↳</span>
              <span className="text-muted-foreground line-clamp-2 text-xs leading-snug">
                {stoicResponse}
              </span>
            </button>
          ) : null}
        </div>
      </div>
      {expanded && (descriptionText || myNotes) ? (
        <div className="border-border bg-muted/30 mt-2 ml-[3.25rem] space-y-3 rounded-md border p-3">
          {descriptionText ? (
            <RehabMarkdown content={descriptionText} className="prose-xs" />
          ) : null}
          {myNotes ? (
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-medium">My Notes</p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {myNotes}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ArchivedSection({
  events,
  loading,
  collapsed,
  onToggleCollapse,
  onEdit,
}: {
  events: RehabArchivedEvent[];
  loading: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onEdit: (event: RehabPlanEvent) => void;
}) {
  if (!loading && events.length === 0) {
    return null;
  }

  return (
    <section className="border-border mt-2 border-t">
      <button
        type="button"
        onClick={onToggleCollapse}
        className="text-foreground flex w-full items-center justify-between py-4 text-left text-sm font-medium"
      >
        <span>
          Archived
          {events.length > 0 ? ` (${events.length})` : ""}
        </span>
        <ChevronDown
          className={cn(
            "text-muted-foreground size-4 shrink-0 transition-transform",
            collapsed && "-rotate-90",
          )}
          aria-hidden
        />
      </button>
      {!collapsed ? (
        <div className="flex flex-col gap-1 pb-4">
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading archived…</p>
          ) : null}
          {events.map((event) => (
            <HistoryEventRow
              key={`${event.id}-${event.deletedAt}`}
              event={event}
              archivedAt={event.deletedAt}
              onToggleCompleted={() => {}}
              onEdit={() => onEdit(event)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
