"use client";

import { ChevronDown, Search, Stethoscope } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CalendarClient } from "@/components/calendar/calendar-client";
import { EventFormDialog } from "@/components/calendar/event-form-dialog";
import { RehabInlineAddTask } from "@/components/rehab/rehab-inline-add-task";
import {
  RehabUpcomingViewSwitcher,
  type RehabUpcomingViewMode,
} from "@/components/rehab/rehab-upcoming-view-switcher";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  buildUpcomingListSections,
  defaultStartForUpcomingDay,
  filterUpcomingEventsBySearch,
  hasMoreUpcomingDays,
  nextUpcomingVisibleDays,
  upcomingEventScheduleLabel,
  UPCOMING_INITIAL_DAYS,
  type UpcomingListSection,
} from "@/lib/rehab/rehab-upcoming-utils";
import { rehabEventTimeLabel } from "@/lib/rehab/rehab-today-utils";
import { isClinicalRehabEvent } from "@/lib/rehab/rehab-clinical-utils";
import { useRehabPlanStore } from "@/stores/rehab-plan-store";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types/calendar";
import type { RehabPlanEvent } from "@/types/rehab";

function initialViewMode(searchParams: URLSearchParams | null): RehabUpcomingViewMode {
  return searchParams?.get("view") === "calendar" ? "calendar" : "list";
}

export function RehabUpcomingView() {
  const searchParams = useSearchParams();
  const events = useRehabPlanStore((state) => state.events);
  const persistence = useRehabPlanStore((state) => state.persistence);
  const toggleCompleted = useRehabPlanStore((state) => state.toggleCompleted);

  const [view, setView] = useState<RehabUpcomingViewMode>(() =>
    initialViewMode(searchParams),
  );
  /** Pre-mount calendar in the background so list ↔ calendar toggles stay instant. */
  const [calendarMounted, setCalendarMounted] = useState(
    () => initialViewMode(searchParams) === "calendar",
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<RehabPlanEvent | null>(null);
  const [draftStart, setDraftStart] = useState(() => new Date());
  const [draftAllDay, setDraftAllDay] = useState(false);
  const [overdueCollapsed, setOverdueCollapsed] = useState(true);
  const [visibleDays, setVisibleDays] = useState(UPCOMING_INITIAL_DAYS);
  const [activeAddId, setActiveAddId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const trimmedSearch = searchQuery.trim();
  const searchActive = trimmedSearch.length > 0;

  const sections = useMemo(
    () => buildUpcomingListSections(events, new Date(), visibleDays),
    [events, visibleDays],
  );

  const searchResults = useMemo(
    () => filterUpcomingEventsBySearch(events, trimmedSearch),
    [events, trimmedSearch],
  );

  const canShowMore = hasMoreUpcomingDays(visibleDays);

  useEffect(() => {
    if (calendarMounted) {
      return;
    }
    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(() => setCalendarMounted(true), {
        timeout: 1500,
      });
      return () => cancelIdleCallback(id);
    }
    const timer = window.setTimeout(() => setCalendarMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, [calendarMounted]);

  const handleViewChange = useCallback((next: RehabUpcomingViewMode) => {
    setCalendarMounted(true);
    setView(next);
  }, []);

  const openEdit = useCallback((event: RehabPlanEvent) => {
    setSelectedEvent(event);
    setDraftAllDay(event.allDay);
    setDraftStart(new Date(event.startAt));
    setDialogOpen(true);
  }, []);

  function handleSaved(_event: CalendarEvent) {
    setDialogOpen(false);
  }

  function handleDeleted(_id: string) {
    setDialogOpen(false);
  }

  async function handleToggleCompleted(event: RehabPlanEvent, completed: boolean) {
    await toggleCompleted(event.id, completed);
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="border-border shrink-0 space-y-3 border-b px-4 py-3 md:px-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold tracking-tight">Upcoming</h1>
          <RehabUpcomingViewSwitcher view={view} onViewChange={handleViewChange} />
        </div>

        <div className="relative min-w-0">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search tasks"
            className="bg-muted/40 h-9 rounded-lg border-transparent pl-9 text-sm shadow-none"
            aria-label="Search upcoming tasks"
          />
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        {searchActive ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 md:px-6">
            <div className="text-muted-foreground py-4 text-xs">
              {searchResults.length === 0
                ? `No tasks match “${trimmedSearch}”.`
                : `${searchResults.length} task${searchResults.length === 1 ? "" : "s"}`}
            </div>
            <div className="flex flex-col gap-1">
              {searchResults.map((event) => (
                <UpcomingEventRow
                  key={event.id}
                  event={event}
                  scheduleLabel={upcomingEventScheduleLabel(event)}
                  onToggleCompleted={(completed) =>
                    void handleToggleCompleted(event, completed)
                  }
                  onEdit={() => openEdit(event)}
                />
              ))}
            </div>
          </div>
        ) : null}

        {calendarMounted && !searchActive ? (
          <div
            className={cn(
              "flex min-h-0 flex-1 flex-col",
              view !== "calendar" && "hidden",
            )}
            aria-hidden={view !== "calendar"}
          >
            <CalendarClient persistence={persistence} variant="rehab" />
          </div>
        ) : null}

        {!searchActive ? (
        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto px-4 pb-8 md:px-6",
            view !== "list" && "hidden",
          )}
          aria-hidden={view !== "list"}
        >
          {sections.map((section) => (
            <UpcomingSectionBlock
              key={sectionKey(section)}
              section={section}
              overdueCollapsed={overdueCollapsed}
              onToggleOverdue={() => setOverdueCollapsed((value) => !value)}
              onToggleCompleted={handleToggleCompleted}
              onEdit={openEdit}
              activeAddId={activeAddId}
              onActivateAdd={setActiveAddId}
            />
          ))}

          {!canShowMore ? null : (
            <div className="border-border border-t py-4">
              <button
                type="button"
                onClick={() =>
                  setVisibleDays((current) => nextUpcomingVisibleDays(current))
                }
                className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
              >
                See more
              </button>
            </div>
          )}
        </div>
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
    </div>
  );
}

function sectionKey(section: UpcomingListSection): string {
  if (section.kind === "overdue") {
    return "overdue";
  }
  return `day-${section.date.toISOString()}`;
}

function UpcomingSectionBlock({
  section,
  overdueCollapsed,
  onToggleOverdue,
  onToggleCompleted,
  onEdit,
  activeAddId,
  onActivateAdd,
}: {
  section: UpcomingListSection;
  overdueCollapsed: boolean;
  onToggleOverdue: () => void;
  onToggleCompleted: (event: RehabPlanEvent, completed: boolean) => void;
  onEdit: (event: RehabPlanEvent) => void;
  activeAddId: string | null;
  onActivateAdd: (id: string | null) => void;
}) {
  if (section.kind === "overdue") {
    return (
      <section className="border-border border-t first:border-t-0">
        <button
          type="button"
          onClick={onToggleOverdue}
          className="text-foreground flex w-full items-center justify-between py-4 text-left text-sm font-medium"
        >
          <span>Overdue</span>
          <ChevronDown
            className={cn(
              "text-muted-foreground size-4 shrink-0 transition-transform",
              overdueCollapsed && "-rotate-90",
            )}
            aria-hidden
          />
        </button>
        {!overdueCollapsed ? (
          <UpcomingEventList
            events={section.events}
            onToggleCompleted={onToggleCompleted}
            onEdit={onEdit}
            showAdd={false}
          />
        ) : null}
      </section>
    );
  }

  const label = section.label;
  const addStart = defaultStartForUpcomingDay(section.date);
  const addId = `upcoming-${section.date.toISOString()}`;

  return (
    <section className="border-border border-t first:border-t-0">
      <div className="text-foreground py-4 text-sm font-medium">{label}</div>
      <UpcomingEventList
        events={section.events}
        onToggleCompleted={onToggleCompleted}
        onEdit={onEdit}
        addId={addId}
        activeAddId={activeAddId}
        onActivateAdd={onActivateAdd}
        defaultStart={addStart}
      />
    </section>
  );
}

function UpcomingEventList({
  events,
  onToggleCompleted,
  onEdit,
  addId,
  activeAddId,
  onActivateAdd,
  defaultStart,
  showAdd = true,
}: {
  events: RehabPlanEvent[];
  onToggleCompleted: (event: RehabPlanEvent, completed: boolean) => void;
  onEdit: (event: RehabPlanEvent) => void;
  addId?: string;
  activeAddId?: string | null;
  onActivateAdd?: (id: string | null) => void;
  defaultStart?: Date;
  showAdd?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 pb-4">
      {events.map((event) => (
        <UpcomingEventRow
          key={event.id}
          event={event}
          onToggleCompleted={(completed) => onToggleCompleted(event, completed)}
          onEdit={() => onEdit(event)}
        />
      ))}

      {showAdd && addId && onActivateAdd && defaultStart ? (
        <RehabInlineAddTask
          addId={addId}
          activeAddId={activeAddId ?? null}
          onActivate={onActivateAdd}
          defaultStart={defaultStart}
        />
      ) : null}
    </div>
  );
}

function UpcomingEventRow({
  event,
  onToggleCompleted,
  onEdit,
  scheduleLabel,
}: {
  event: RehabPlanEvent;
  onToggleCompleted: (completed: boolean) => void;
  onEdit: () => void;
  scheduleLabel?: string;
}) {
  const completed = Boolean(event.completedAt);
  const timeLabel = scheduleLabel ?? rehabEventTimeLabel(event);

  return (
    <div className="flex items-start gap-3 py-2">
      <Checkbox
        checked={completed}
        onCheckedChange={(value) => onToggleCompleted(Boolean(value))}
        className="mt-0.5 rounded-full"
        aria-label={`Mark ${event.title} ${completed ? "incomplete" : "complete"}`}
      />
      <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
        <p
          className={cn(
            "flex items-center gap-1.5 text-sm font-medium leading-snug",
            completed && "text-muted-foreground line-through",
          )}
        >
          {isClinicalRehabEvent(event.eventKind) ? (
            <Stethoscope className="size-3.5 shrink-0" aria-hidden />
          ) : null}
          <span>{event.title}</span>
        </p>
        {timeLabel ? (
          <p className="text-muted-foreground mt-0.5 text-xs tabular-nums">
            {timeLabel}
          </p>
        ) : null}
      </button>
    </div>
  );
}
