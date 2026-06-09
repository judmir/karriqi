"use client";

import { CalendarDays, ChevronDown, List } from "lucide-react";
import Link from "next/link";
import { endOfDay, format, startOfDay } from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { EventFormDialog } from "@/components/calendar/event-form-dialog";
import {
  RehabInlineAddTask,
  type RehabInlineTaskCreated,
} from "@/components/rehab/rehab-inline-add-task";
import { RehabEventKindIcon } from "@/components/rehab/rehab-event-kind-icon";
import { RehabJournalDialog } from "@/components/rehab/rehab-journal-dialog";
import { RehabMarkdown } from "@/components/rehab/rehab-markdown";
import { RehabStoicDialog } from "@/components/rehab/rehab-stoic-dialog";
import { buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ROUTES } from "@/config/routes";
import {
  defaultStartForRehabSection,
  filterRehabEventsForDay,
  groupRehabTodayEvents,
  isSameRehabDay,
  REHAB_TODAY_SECTION_LABELS,
  REHAB_TODAY_SECTIONS,
  rehabEventTimeLabel,
  rehabTodaySectionForSchedule,
  type RehabTodaySection,
} from "@/lib/rehab/rehab-today-utils";
import {
  getEventDescriptionPlainText,
  parseEventDescription,
} from "@/lib/calendar/event-subtasks";
import { expandRehabEvents } from "@/lib/rehab/expand-rehab-events";
import {
  getStoicResponseData,
  isStoicEvent,
  summarizeStoicResponse,
} from "@/lib/rehab/stoic-response";
import { useRehabPlanStore } from "@/stores/rehab-plan-store";
import { cn } from "@/lib/utils";
import type { RehabPlanEvent } from "@/types/rehab";

const ACTIVE_SECTIONS = REHAB_TODAY_SECTIONS.filter(
  (section) => section !== "completed",
);

type DepartedTaskNotice = {
  title: string;
  date: Date;
  fromSection: Exclude<RehabTodaySection, "completed">;
};

export function RehabTodayView() {
  const today = useMemo(() => startOfDay(new Date()), []);
  const allEvents = useRehabPlanStore((state) => state.events);
  const persistence = useRehabPlanStore((state) => state.persistence);
  const toggleOccurrenceCompleted = useRehabPlanStore(
    (state) => state.toggleOccurrenceCompleted,
  );

  const events = useMemo(() => {
    const expanded = expandRehabEvents(
      allEvents,
      startOfDay(today),
      endOfDay(today),
    );
    return filterRehabEventsForDay(expanded, today);
  }, [allEvents, today]);
  const [collapsed, setCollapsed] = useState<
    Record<RehabTodaySection, boolean>
  >({
    all_day: false,
    morning: false,
    afternoon: false,
    evening: false,
    completed: false,
  });
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
  const [activeAddId, setActiveAddId] = useState<string | null>(null);
  const [highlightEventId, setHighlightEventId] = useState<string | null>(null);
  const [sectionHighlight, setSectionHighlight] = useState<Exclude<
    RehabTodaySection,
    "completed"
  > | null>(null);
  const [departedNotice, setDepartedNotice] =
    useState<DepartedTaskNotice | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);

  const groups = useMemo(() => groupRehabTodayEvents(events), [events]);

  const clearFeedbackTimer = useCallback(() => {
    if (feedbackTimerRef.current !== null) {
      window.clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearFeedbackTimer(), [clearFeedbackTimer]);

  const scrollToEvent = useCallback((eventId: string) => {
    window.requestAnimationFrame(() => {
      document
        .querySelector(`[data-rehab-event-id="${eventId}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, []);

  const handleTaskCreated = useCallback(
    (
      created: RehabInlineTaskCreated,
      fromSection: Exclude<RehabTodaySection, "completed">,
    ) => {
      clearFeedbackTimer();

      const targetSection = rehabTodaySectionForSchedule(
        created.startAt,
        created.allDay,
      );
      const onToday = isSameRehabDay(created.date, today);

      if (!onToday) {
        setDepartedNotice({
          title: created.title,
          date: created.date,
          fromSection,
        });
        setHighlightEventId(null);
        setSectionHighlight(null);
        feedbackTimerRef.current = window.setTimeout(() => {
          setDepartedNotice(null);
          feedbackTimerRef.current = null;
        }, 3200);
        return;
      }

      if (targetSection !== fromSection) {
        setCollapsed((prev) => ({ ...prev, [targetSection]: false }));
        setSectionHighlight(targetSection);
      }

      setHighlightEventId(created.id);
      feedbackTimerRef.current = window.setTimeout(() => {
        setHighlightEventId(null);
        setSectionHighlight(null);
        feedbackTimerRef.current = null;
      }, 2800);

      window.setTimeout(
        () => scrollToEvent(created.id),
        targetSection === fromSection ? 0 : 120,
      );
    },
    [clearFeedbackTimer, scrollToEvent, today],
  );

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

  function handleSaved() {
    setDialogOpen(false);
  }

  function handleDeleted() {
    setDialogOpen(false);
  }

  async function handleToggleCompleted(
    event: RehabPlanEvent,
    completed: boolean,
  ) {
    await toggleOccurrenceCompleted(event, completed);
  }

  function toggleSection(section: RehabTodaySection) {
    setCollapsed((prev) => ({ ...prev, [section]: !prev[section] }));
  }

  return (
    <div className="flex w-full flex-col gap-6 px-4 pb-8 md:px-6">
      <div className="flex items-center justify-end gap-1">
        <Link
          href={ROUTES.rehabPlan}
          prefetch={false}
          aria-label="Open upcoming list"
          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
        >
          <List className="size-4" />
        </Link>
        <Link
          href={`${ROUTES.rehabPlan}?view=calendar`}
          prefetch={false}
          aria-label="Open upcoming calendar"
          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
        >
          <CalendarDays className="size-4" />
        </Link>
      </div>

      <div className="flex w-full flex-col">
        {ACTIVE_SECTIONS.map((section) => (
          <RehabTodaySectionBlock
            key={section}
            section={section}
            title={REHAB_TODAY_SECTION_LABELS[section]}
            collapsed={collapsed[section]}
            onToggleCollapse={() => toggleSection(section)}
            events={groups[section]}
            onToggleCompleted={handleToggleCompleted}
            onEdit={openEdit}
            addId={`today-${section}`}
            activeAddId={activeAddId}
            onActivateAdd={setActiveAddId}
            defaultStart={defaultStartForRehabSection(section, today)}
            highlightEventId={highlightEventId}
            sectionHighlighted={sectionHighlight === section}
            departedNotice={
              departedNotice?.fromSection === section ? departedNotice : null
            }
            onTaskCreated={(created) => handleTaskCreated(created, section)}
          />
        ))}

        {groups.completed.length > 0 ? (
          <RehabTodaySectionBlock
            section="completed"
            title={`Completed ${groups.completed.length}`}
            collapsed={collapsed.completed}
            onToggleCollapse={() => toggleSection("completed")}
            events={groups.completed}
            onToggleCompleted={handleToggleCompleted}
            onEdit={openEdit}
            showAdd={false}
          />
        ) : null}
      </div>

      <EventFormDialog
        open={dialogOpen && selectedEvent !== null}
        onOpenChange={setDialogOpen}
        event={selectedEvent}
        defaultStart={draftStart}
        defaultAllDay={draftAllDay}
        persistence={persistence}
        variant="rehab"
        onSaved={handleSaved}
        onDeleted={handleDeleted}
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

function RehabTodaySectionBlock({
  section,
  title,
  collapsed,
  onToggleCollapse,
  events,
  onToggleCompleted,
  onEdit,
  addId,
  activeAddId,
  onActivateAdd,
  defaultStart,
  showAdd = true,
  highlightEventId,
  sectionHighlighted = false,
  departedNotice,
  onTaskCreated,
}: {
  section?: RehabTodaySection;
  title: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  events: RehabPlanEvent[];
  onToggleCompleted: (event: RehabPlanEvent, completed: boolean) => void;
  onEdit: (event: RehabPlanEvent) => void;
  addId?: string;
  activeAddId?: string | null;
  onActivateAdd?: (id: string | null) => void;
  defaultStart?: Date;
  showAdd?: boolean;
  highlightEventId?: string | null;
  sectionHighlighted?: boolean;
  departedNotice?: DepartedTaskNotice | null;
  onTaskCreated?: (created: RehabInlineTaskCreated) => void;
}) {
  return (
    <section
      className="border-border border-t first:border-t-0"
      data-rehab-section={section}
    >
      <button
        type="button"
        onClick={onToggleCollapse}
        className={cn(
          "text-foreground flex w-full items-center justify-between py-4 text-left text-sm font-medium",
          sectionHighlighted && "rehab-section-locate",
        )}
      >
        <span>{title}</span>
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
          {departedNotice ? (
            <div
              role="status"
              className="rehab-task-departure-notice border-primary/25 bg-primary/5 mb-2 rounded-lg border px-3 py-2.5"
            >
              <p className="text-sm font-medium leading-snug">
                “{departedNotice.title}”
              </p>
              <p className="text-muted-foreground mt-1 text-xs leading-snug">
                Saved for {format(departedNotice.date, "EEE d MMM")} — find it
                in{" "}
                <Link
                  href={ROUTES.rehabPlan}
                  prefetch={false}
                  className="text-foreground underline-offset-2 hover:underline"
                >
                  Upcoming
                </Link>
              </p>
            </div>
          ) : null}

          {events.map((event) => (
            <RehabTodayItemRow
              key={event.id}
              event={event}
              highlighted={highlightEventId === event.id}
              onToggleCompleted={(completed) =>
                onToggleCompleted(event, completed)
              }
              onEdit={() => onEdit(event)}
            />
          ))}

          {showAdd && addId && onActivateAdd && defaultStart ? (
            <RehabInlineAddTask
              addId={addId}
              activeAddId={activeAddId ?? null}
              onActivate={onActivateAdd}
              defaultStart={defaultStart}
              onCreated={onTaskCreated}
            />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function RehabTodayItemRow({
  event,
  highlighted = false,
  onToggleCompleted,
  onEdit,
}: {
  event: RehabPlanEvent;
  highlighted?: boolean;
  onToggleCompleted: (completed: boolean) => void;
  onEdit: () => void;
}) {
  const completed = Boolean(event.completedAt);
  const timeLabel = rehabEventTimeLabel(event);
  const [expanded, setExpanded] = useState(false);
  const descriptionText = getEventDescriptionPlainText(event.description);
  const myNotes = parseEventDescription(event.description).myNotes.trim();
  const hasDescription = Boolean(descriptionText);
  const hasDetails = hasDescription || Boolean(myNotes);
  const stoicResponse = isStoicEvent(event)
    ? summarizeStoicResponse(getStoicResponseData(event.description))
    : "";

  return (
    <div
      data-rehab-event-id={event.id}
      className={cn(
        "flex flex-col gap-1 rounded-lg py-2",
        highlighted && "rehab-task-locate",
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={completed}
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
          </button>
          {hasDetails ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
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
        <div className="ml-[3.25rem] space-y-3 rounded-md border border-border bg-muted/30 p-3">
          {descriptionText ? (
            <RehabMarkdown content={descriptionText} className="prose-xs" />
          ) : null}
          {myNotes ? (
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-medium">
                My Notes
              </p>
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
