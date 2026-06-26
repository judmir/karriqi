"use client";

import { addDays, endOfDay, isSameDay, startOfDay } from "date-fns";
import { ChevronDown, History, Loader2, Search, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { CalendarClient } from "@/components/calendar/calendar-client";
import { EventFormDialog } from "@/components/calendar/event-form-dialog";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { RehabEventSubtaskChecklist } from "@/components/rehab/rehab-event-subtask-checklist";
import { RehabInlineAddTask } from "@/components/rehab/rehab-inline-add-task";
import { RehabEventKindIcon } from "@/components/rehab/rehab-event-kind-icon";
import { RehabRecurringIcon } from "@/components/rehab/rehab-recurring-icon";
import { RehabJournalDialog } from "@/components/rehab/rehab-journal-dialog";
import { RehabStoicPathDialog } from "@/components/rehab/rehab-stoic-path-dialog";
import { RehabStoicDialog } from "@/components/rehab/rehab-stoic-dialog";
import { RehabUpcomingKindFilters } from "@/components/rehab/rehab-upcoming-kind-filters";
import { UpcomingSearchLoading } from "@/components/rehab/upcoming-search-loading";
import { UpcomingSearchRecordingRow } from "@/components/rehab/upcoming-search-recording-row";
import {
  RehabUpcomingViewSwitcher,
  type RehabUpcomingViewMode,
} from "@/components/rehab/rehab-upcoming-view-switcher";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  serializeEventDescription,
  type EventSubtask,
} from "@/lib/calendar/event-subtasks";
import {
  allEventSubtasksDone,
  resolveEventSubtasks,
} from "@/modules/rehab/neuro-rehab-2026/day0-checklist";
import { searchUpcomingRehabAction } from "@/lib/rehab/rehab-upcoming-search-actions";
import {
  buildUpcomingListSections,
  defaultStartForUpcomingDay,
  formatUpcomingSearchResultsLabel,
  hasMoreUpcomingDays,
  nextUpcomingVisibleDays,
  maxFutureDaysAfterToday,
  paginateUpcomingSearchItems,
  searchUpcomingItems,
  upcomingEventScheduleLabel,
  upcomingListExpandWindow,
  upcomingSearchSummaryLabel,
  UPCOMING_FUTURE_DAYS_INITIAL,
  type UpcomingKindFilterId,
  type UpcomingListSection,
  type UpcomingSearchItem,
} from "@/lib/rehab/rehab-upcoming-utils";
import { rehabEventTimeLabel } from "@/lib/rehab/rehab-today-utils";
import { expandRehabEvents } from "@/lib/rehab/expand-rehab-events";
import { isStoicDialogEvent } from "@/lib/rehab/stoic-response";
import { setStoicPathExerciseCompleted } from "@/lib/rehab/stoic-path-completion";
import {
  getStoicPathExerciseId,
  injectStoicPathEventsForRange,
  isStoicPathPlanEvent,
} from "@/lib/rehab/stoic-rehab-utils";
import { PROGRAM_START } from "@/modules/rehab/neuro-rehab-2026/constants";
import { useOpenRehabEventEdit } from "@/lib/rehab/use-open-rehab-event-edit";

import { useRehabPlanStore } from "@/stores/rehab-plan-store";
import { useStoicRehabStore } from "@/stores/stoic-rehab-store";
import { cn } from "@/lib/utils";
import type { RehabPlanEvent } from "@/types/rehab";

function initialViewMode(
  searchParams: URLSearchParams | null,
): RehabUpcomingViewMode {
  return searchParams?.get("view") === "calendar" ? "calendar" : "list";
}

export function RehabUpcomingView() {
  const searchParams = useSearchParams();
  const allEvents = useRehabPlanStore((state) => state.events);
  const persistence = useRehabPlanStore((state) => state.persistence);
  const toggleOccurrenceCompleted = useRehabPlanStore(
    (state) => state.toggleOccurrenceCompleted,
  );
  const updateEvent = useRehabPlanStore((state) => state.updateEvent);
  const deleteOccurrence = useRehabPlanStore((state) => state.deleteOccurrence);
  const stoicCompletions = useStoicRehabStore((state) => state.completions);
  const saveStoicCompletion = useStoicRehabStore((state) => state.saveCompletion);
  const clearStoicCompletion = useStoicRehabStore(
    (state) => state.clearCompletion,
  );
  const toggleOccurrenceCompletedForStoic = useRehabPlanStore(
    (state) => state.toggleOccurrenceCompleted,
  );

  const [view, setView] = useState<RehabUpcomingViewMode>(() =>
    initialViewMode(searchParams),
  );
  /** Pre-mount calendar in the background so list ↔ calendar toggles stay instant. */
  const [calendarMounted, setCalendarMounted] = useState(
    () => initialViewMode(searchParams) === "calendar",
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<RehabPlanEvent | null>(
    null,
  );
  const [journalOpen, setJournalOpen] = useState(false);
  const [journalEvent, setJournalEvent] = useState<RehabPlanEvent | null>(null);
  const [stoicOpen, setStoicOpen] = useState(false);
  const [stoicEvent, setStoicEvent] = useState<RehabPlanEvent | null>(null);
  const [stoicPathOpen, setStoicPathOpen] = useState(false);
  const [stoicPathEvent, setStoicPathEvent] = useState<RehabPlanEvent | null>(
    null,
  );
  const [draftStart, setDraftStart] = useState(() => new Date());
  const [draftAllDay, setDraftAllDay] = useState(false);
  const [expandedPastDays, setExpandedPastDays] = useState<Set<string>>(
    () => new Set(),
  );
  const [visibleFutureDays, setVisibleFutureDays] = useState(
    UPCOMING_FUTURE_DAYS_INITIAL,
  );
  const [activeAddId, setActiveAddId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [kindFilters, setKindFilters] = useState<UpcomingKindFilterId[]>([]);
  const [searchPage, setSearchPage] = useState<{
    items: UpcomingSearchItem[];
    total: number;
    hasMore: boolean;
  } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchLoadingMore, setSearchLoadingMore] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<RehabPlanEvent | null>(null);

  const trimmedSearch = searchQuery.trim();
  const textSearchActive = trimmedSearch.length > 0;
  const filterActive = kindFilters.length > 0;
  const searchModeActive = textSearchActive || filterActive;
  const searchPending = textSearchActive && debouncedSearch !== trimmedSearch;
  const showSearchLoading = searchPending || searchLoading;

  const handleKindFiltersChange = useCallback((next: UpcomingKindFilterId[]) => {
    setKindFilters(next);
  }, []);

  const searchSummary = useMemo(
    () =>
      upcomingSearchSummaryLabel({
        query: debouncedSearch,
        kindFilters,
      }),
    [debouncedSearch, kindFilters],
  );

  const searchFetchKey = useMemo(
    () =>
      JSON.stringify({
        query: debouncedSearch,
        kindFilters,
      }),
    [debouncedSearch, kindFilters],
  );

  useEffect(() => {
    if (!textSearchActive) {
      setDebouncedSearch("");
      return;
    }
    const timer = window.setTimeout(() => {
      setDebouncedSearch(trimmedSearch);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [textSearchActive, trimmedSearch]);

  /** Expand recurring masters only for the visible list window (not the full program). */
  const expandedEvents = useMemo(() => {
    const now = new Date();
    const { start: windowStart, end: windowEnd } = upcomingListExpandWindow(
      now,
      visibleFutureDays,
    );
    const expanded = expandRehabEvents(allEvents, windowStart, windowEnd);
    return injectStoicPathEventsForRange(
      expanded,
      windowStart,
      windowEnd,
      stoicCompletions,
    );
  }, [allEvents, stoicCompletions, visibleFutureDays]);

  const sections = useMemo(
    () => buildUpcomingListSections(expandedEvents, new Date(), visibleFutureDays),
    [expandedEvents, visibleFutureDays],
  );

  /** Full-window expansion for server search + client fallback. */
  const searchExpandedEvents = useMemo(() => {
    const now = new Date();
    const windowStart = startOfDay(addDays(PROGRAM_START, -1));
    const windowEnd = endOfDay(
      addDays(startOfDay(now), maxFutureDaysAfterToday(now, allEvents)),
    );
    const expanded = expandRehabEvents(allEvents, windowStart, windowEnd);
    return injectStoicPathEventsForRange(
      expanded,
      windowStart,
      windowEnd,
      stoicCompletions,
    );
  }, [allEvents, stoicCompletions]);

  useEffect(() => {
    if (!searchModeActive) {
      setSearchPage(null);
      setSearchLoading(false);
      return;
    }
    if (searchPending) {
      return;
    }

    let cancelled = false;
    setSearchLoading(true);
    setSearchPage(null);

    const { query, kindFilters: activeKindFilters } = JSON.parse(
      searchFetchKey,
    ) as {
      query: string;
      kindFilters: UpcomingKindFilterId[];
    };

    void searchUpcomingRehabAction({
      query,
      kindFilters: activeKindFilters,
      offset: 0,
    })
      .then((result) => {
        if (cancelled) {
          return;
        }
        if (result.ok) {
          setSearchPage({
            items: result.page.items,
            total: result.page.total,
            hasMore: result.page.hasMore,
          });
          return;
        }

        const page = paginateUpcomingSearchItems(
          searchUpcomingItems(searchExpandedEvents, {
            query,
            kindFilters: activeKindFilters,
          }),
        );
        setSearchPage({
          items: page.items,
          total: page.total,
          hasMore: page.hasMore,
        });
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        const page = paginateUpcomingSearchItems(
          searchUpcomingItems(searchExpandedEvents, {
            query,
            kindFilters: activeKindFilters,
          }),
        );
        setSearchPage({
          items: page.items,
          total: page.total,
          hasMore: page.hasMore,
        });
      })
      .finally(() => {
        if (!cancelled) {
          setSearchLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [searchModeActive, searchPending, searchFetchKey, searchExpandedEvents]);

  const searchResultsLabel = useMemo(() => {
    if (!searchPage) {
      return null;
    }
    return formatUpcomingSearchResultsLabel({
      shown: searchPage.items.length,
      total: searchPage.total,
      summary: searchSummary,
    });
  }, [searchPage, searchSummary]);

  const loadMoreSearch = useCallback(async () => {
    if (!searchPage?.hasMore || searchLoadingMore || showSearchLoading) {
      return;
    }

    setSearchLoadingMore(true);
    const result = await searchUpcomingRehabAction({
      query: debouncedSearch,
      kindFilters,
      offset: searchPage.items.length,
    });

    if (result.ok) {
      setSearchPage((current) => {
        if (!current) {
          return {
            items: result.page.items,
            total: result.page.total,
            hasMore: result.page.hasMore,
          };
        }
        const items = [...current.items, ...result.page.items];
        return {
          items,
          total: result.page.total,
          hasMore: items.length < result.page.total,
        };
      });
    } else {
      const page = paginateUpcomingSearchItems(
        searchUpcomingItems(searchExpandedEvents, {
          query: debouncedSearch,
          kindFilters,
        }),
        searchPage.items.length,
      );
      setSearchPage((current) => {
        if (!current) {
          return {
            items: page.items,
            total: page.total,
            hasMore: page.hasMore,
          };
        }
        const items = [...current.items, ...page.items];
        return {
          items,
          total: page.total,
          hasMore: items.length < page.total,
        };
      });
    }
    setSearchLoadingMore(false);
  }, [
    debouncedSearch,
    kindFilters,
    searchExpandedEvents,
    searchLoadingMore,
    searchPage,
    showSearchLoading,
  ]);

  const canShowMore = hasMoreUpcomingDays(
    visibleFutureDays,
    new Date(),
    allEvents,
  );

  const todayBlockRef = useRef<HTMLElement | null>(null);
  const scrolledToTodayRef = useRef(false);

  const togglePastDay = useCallback((key: string) => {
    setExpandedPastDays((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  /** Anchor the initial scroll on today; past days sit above (scroll up). */
  useEffect(() => {
    if (scrolledToTodayRef.current) {
      return;
    }
    if (view !== "list" || searchModeActive) {
      return;
    }
    const el = todayBlockRef.current;
    if (!el) {
      return;
    }
    el.scrollIntoView({ block: "start" });
    scrolledToTodayRef.current = true;
  }, [view, searchModeActive, sections]);

  const handleViewChange = useCallback((next: RehabUpcomingViewMode) => {
    setCalendarMounted(true);
    setView(next);
  }, []);

  const openRehabEventEdit = useOpenRehabEventEdit("plan");

  const openEdit = useCallback(
    (event: RehabPlanEvent) => {
      openRehabEventEdit(event, {
        openTaskModal: (next) => {
          setSelectedEvent(next);
          setDraftAllDay(next.allDay);
          setDraftStart(new Date(next.startAt));
          setDialogOpen(true);
        },
        openJournalModal: (next) => {
          setJournalEvent(next);
          setJournalOpen(true);
        },
        openStoicModal: (next) => {
          setStoicEvent(next);
          setStoicOpen(true);
        },
        openStoicPathModal: (next) => {
          setStoicPathEvent(next);
          setStoicPathOpen(true);
        },
      });
    },
    [openRehabEventEdit],
  );

  function closeEventDialog() {
    setSelectedEvent(null);
    setDialogOpen(false);
  }

  function handleSaved() {
    closeEventDialog();
  }

  function handleDeleted() {
    closeEventDialog();
  }

  async function handleToggleCompleted(
    event: RehabPlanEvent,
    completed: boolean,
  ) {
    if (isStoicPathPlanEvent(event)) {
      await setStoicPathExerciseCompleted(event, completed, {
        saveCompletion: saveStoicCompletion,
        clearCompletion: clearStoicCompletion,
      }, {
        toggleOccurrenceCompleted: toggleOccurrenceCompletedForStoic,
      });
      return;
    }
    await toggleOccurrenceCompleted(event, completed);
  }

  async function handleUpdateSubtasks(
    event: RehabPlanEvent,
    subtasks: EventSubtask[],
  ) {
    const { description, myNotes } = resolveEventSubtasks(event);
    await updateEvent({
      id: event.id,
      description: serializeEventDescription(description, subtasks, myNotes),
    });
  }

  async function handleToggleAllSubtasks(
    event: RehabPlanEvent,
    subtasks: EventSubtask[],
    completed: boolean,
  ) {
    await handleUpdateSubtasks(event, subtasks);
    const currentlyCompleted = Boolean(event.completedAt);
    if (completed !== currentlyCompleted) {
      await toggleOccurrenceCompleted(event, completed);
    }
  }

  function requestDelete(event: RehabPlanEvent) {
    if (isStoicPathPlanEvent(event)) {
      return;
    }
    setEventToDelete(event);
  }

  function confirmDelete() {
    if (!eventToDelete) {
      return;
    }
    const event = eventToDelete;
    setEventToDelete(null);
    void deleteOccurrence(event, "occurrence");
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="border-border shrink-0 space-y-3 border-b px-4 py-3 md:px-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold tracking-tight">Upcoming</h1>
          <div className="flex items-center gap-1">
            <Link
              href={ROUTES.rehabHistory}
              prefetch={false}
              aria-label="Open history"
              className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
            >
              <History className="size-4" />
            </Link>
            <RehabUpcomingViewSwitcher
              view={view}
              onViewChange={handleViewChange}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Filter tasks…"
              className="bg-muted/40 h-8 rounded-lg border-transparent pl-9 text-sm shadow-none"
              aria-label="Filter upcoming tasks and speech recordings"
            />
          </div>

          <RehabUpcomingKindFilters
            selected={kindFilters}
            onChange={handleKindFiltersChange}
          />
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        {searchModeActive ? (
          <div className="relative min-h-0 flex-1 overflow-y-auto px-4 pb-8 md:px-6">
            <div className="text-muted-foreground flex min-h-8 items-center gap-2 py-3 text-xs">
              {!showSearchLoading && searchPage && searchPage.total === 0 ? (
                <span>
                  No tasks or recordings match {searchSummary ?? "your filters"}.
                </span>
              ) : !showSearchLoading && searchResultsLabel ? (
                <span>{searchResultsLabel}</span>
              ) : null}
            </div>

            {showSearchLoading && (!searchPage || searchPage.items.length === 0) ? (
              <UpcomingSearchLoading />
            ) : (
              <div
                className={cn(
                  "relative flex flex-col gap-2",
                  showSearchLoading && "opacity-60",
                )}
              >
                {showSearchLoading ? (
                  <UpcomingSearchLoading variant="overlay" />
                ) : null}
                {searchPage?.items.map((item) => {
                if (item.kind === "recording") {
                  return (
                    <UpcomingSearchRecordingRow
                      key={`recording-${item.recording.id}`}
                      event={item.event}
                      recording={item.recording}
                      persistence={persistence}
                    />
                  );
                }

                const event = item.event;
                return (
                  <UpcomingEventRow
                    key={event.id}
                    event={event}
                    scheduleLabel={upcomingEventScheduleLabel(event)}
                    onToggleCompleted={(completed) =>
                      void handleToggleCompleted(event, completed)
                    }
                    onUpdateSubtasks={(subtasks) =>
                      void handleUpdateSubtasks(event, subtasks)
                    }
                    onToggleAllSubtasks={(subtasks, completed) =>
                      void handleToggleAllSubtasks(event, subtasks, completed)
                    }
                    onEdit={() => openEdit(event)}
                    onDelete={() => requestDelete(event)}
                  />
                );
              })}

                {searchPage?.hasMore ? (
                  <div className="border-border border-t pt-4">
                    <button
                      type="button"
                      onClick={() => void loadMoreSearch()}
                      disabled={searchLoadingMore || showSearchLoading}
                      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {searchLoadingMore ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" aria-hidden />
                          Loading more…
                        </>
                      ) : (
                        "Load more"
                      )}
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ) : null}

        {calendarMounted && !searchModeActive ? (
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

        {!searchModeActive ? (
          <div
            className={cn(
              "min-h-0 flex-1 overflow-y-auto px-4 pb-8 md:px-6",
              view !== "list" && "hidden",
            )}
            aria-hidden={view !== "list"}
          >
            {sections.map((section) => {
              const key = sectionKey(section);
              const isToday =
                !section.isPast &&
                isSameDay(section.date, startOfDay(new Date()));
              return (
                <UpcomingSectionBlock
                  key={key}
                  ref={isToday ? todayBlockRef : undefined}
                  section={section}
                  expanded={!section.isPast || expandedPastDays.has(key)}
                  onTogglePast={() => togglePastDay(key)}
                  onToggleCompleted={handleToggleCompleted}
                  onUpdateSubtasks={handleUpdateSubtasks}
                  onToggleAllSubtasks={handleToggleAllSubtasks}
                  onEdit={openEdit}
                  onDelete={requestDelete}
                  activeAddId={activeAddId}
                  onActivateAdd={setActiveAddId}
                />
              );
            })}

            {!canShowMore ? null : (
              <div className="border-border border-t py-4">
                <button
                  type="button"
                  onClick={() =>
                    setVisibleFutureDays((current) =>
                      nextUpcomingVisibleDays(current, new Date(), allEvents),
                    )
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
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setSelectedEvent(null);
          }
        }}
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

      <RehabStoicPathDialog
        open={stoicPathOpen}
        onOpenChange={setStoicPathOpen}
        date={
          stoicPathEvent ? new Date(stoicPathEvent.startAt) : new Date()
        }
        exerciseId={
          stoicPathEvent
            ? (getStoicPathExerciseId(stoicPathEvent) ?? undefined)
            : undefined
        }
      />

      <AlertDialog
        open={eventToDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEventToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => confirmDelete()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function sectionKey(section: UpcomingListSection): string {
  return `day-${section.date.toISOString()}`;
}

/** An event on a past day that was never completed counts as "missed". */
function isEventMissed(event: RehabPlanEvent): boolean {
  const { subtasks } = resolveEventSubtasks(event);
  const completed =
    subtasks.length > 0
      ? allEventSubtasksDone(subtasks)
      : Boolean(event.completedAt);
  return !completed;
}

const UpcomingSectionBlock = forwardRef<
  HTMLElement,
  {
    section: UpcomingListSection;
    expanded: boolean;
    onTogglePast: () => void;
    onToggleCompleted: (event: RehabPlanEvent, completed: boolean) => void;
    onUpdateSubtasks: (event: RehabPlanEvent, subtasks: EventSubtask[]) => void;
    onToggleAllSubtasks: (
      event: RehabPlanEvent,
      subtasks: EventSubtask[],
      completed: boolean,
    ) => void;
    onEdit: (event: RehabPlanEvent) => void;
    onDelete: (event: RehabPlanEvent) => void | Promise<void>;
    activeAddId: string | null;
    onActivateAdd: (id: string | null) => void;
  }
>(function UpcomingSectionBlock(
  {
    section,
    expanded,
    onTogglePast,
    onToggleCompleted,
    onUpdateSubtasks,
    onToggleAllSubtasks,
    onEdit,
    onDelete,
    activeAddId,
    onActivateAdd,
  },
  ref,
) {
  if (section.isPast) {
    const missedCount = section.events.filter(isEventMissed).length;
    return (
      <section ref={ref} className="border-border border-t first:border-t-0">
        <button
          type="button"
          onClick={onTogglePast}
          className="text-muted-foreground hover:text-foreground flex w-full items-center justify-between py-4 text-left text-sm font-medium transition-colors"
        >
          <span className="flex items-center gap-2">
            {section.label}
            {missedCount > 0 ? (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                {missedCount} missed
              </span>
            ) : null}
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 transition-transform",
              !expanded && "-rotate-90",
            )}
            aria-hidden
          />
        </button>
        {expanded ? (
          <div className="bg-muted/40 mb-3 rounded-lg p-2">
            <UpcomingEventList
              events={section.events}
              isPast
              onToggleCompleted={onToggleCompleted}
              onUpdateSubtasks={onUpdateSubtasks}
              onToggleAllSubtasks={onToggleAllSubtasks}
              onEdit={onEdit}
              onDelete={onDelete}
              showAdd={false}
            />
          </div>
        ) : null}
      </section>
    );
  }

  const label = section.label;
  const addStart = defaultStartForUpcomingDay(section.date);
  const addId = `upcoming-${section.date.toISOString()}`;

  return (
    <section ref={ref} className="border-border border-t first:border-t-0">
      <div className="text-foreground py-4 text-sm font-medium">{label}</div>
      <UpcomingEventList
        events={section.events}
        onToggleCompleted={onToggleCompleted}
        onUpdateSubtasks={onUpdateSubtasks}
        onToggleAllSubtasks={onToggleAllSubtasks}
        onEdit={onEdit}
        onDelete={onDelete}
        addId={addId}
        activeAddId={activeAddId}
        onActivateAdd={onActivateAdd}
        defaultStart={addStart}
      />
    </section>
  );
});

function UpcomingEventList({
  events,
  onToggleCompleted,
  onUpdateSubtasks,
  onToggleAllSubtasks,
  onEdit,
  onDelete,
  addId,
  activeAddId,
  onActivateAdd,
  defaultStart,
  showAdd = true,
  isPast = false,
}: {
  events: RehabPlanEvent[];
  onToggleCompleted: (event: RehabPlanEvent, completed: boolean) => void;
  onUpdateSubtasks: (event: RehabPlanEvent, subtasks: EventSubtask[]) => void;
  onToggleAllSubtasks: (
    event: RehabPlanEvent,
    subtasks: EventSubtask[],
    completed: boolean,
  ) => void;
  onEdit: (event: RehabPlanEvent) => void;
  onDelete: (event: RehabPlanEvent) => void | Promise<void>;
  addId?: string;
  activeAddId?: string | null;
  onActivateAdd?: (id: string | null) => void;
  defaultStart?: Date;
  showAdd?: boolean;
  isPast?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 pb-4">
      {events.map((event) => (
        <UpcomingEventRow
          key={event.id}
          event={event}
          isPast={isPast}
          onToggleCompleted={(completed) => onToggleCompleted(event, completed)}
          onUpdateSubtasks={(subtasks) => onUpdateSubtasks(event, subtasks)}
          onToggleAllSubtasks={(subtasks, completed) =>
            onToggleAllSubtasks(event, subtasks, completed)
          }
          onEdit={() => onEdit(event)}
          onDelete={() => void onDelete(event)}
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
  onUpdateSubtasks,
  onToggleAllSubtasks,
  onEdit,
  onDelete,
  scheduleLabel,
  isPast = false,
}: {
  event: RehabPlanEvent;
  onToggleCompleted: (completed: boolean) => void;
  onUpdateSubtasks: (subtasks: EventSubtask[]) => void;
  onToggleAllSubtasks: (subtasks: EventSubtask[], completed: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  scheduleLabel?: string;
  isPast?: boolean;
}) {
  const { subtasks } = resolveEventSubtasks(event);
  const hasSubtasks = subtasks.length > 0;
  const allSubtasksDone = hasSubtasks && allEventSubtasksDone(subtasks);
  const completed = hasSubtasks ? allSubtasksDone : Boolean(event.completedAt);
  const missed = isPast && !completed;
  const timeLabel = scheduleLabel ?? rehabEventTimeLabel(event);

  function handleMainToggle(checked: boolean) {
    if (hasSubtasks) {
      const next = subtasks.map((item) => ({ ...item, done: checked }));
      onToggleAllSubtasks(next, checked);
      return;
    }
    onToggleCompleted(checked);
  }

  function handleSubtaskToggle(next: EventSubtask[]) {
    onUpdateSubtasks(next);
    const shouldComplete = allEventSubtasksDone(next);
    const currentlyCompleted = Boolean(event.completedAt);
    if (shouldComplete !== currentlyCompleted) {
      onToggleCompleted(shouldComplete);
    }
  }

  return (
    <div className="group rounded-lg py-2 pr-1">
      <div className="flex items-start gap-3">
        <Checkbox
          checked={completed}
          onCheckedChange={(value) => handleMainToggle(Boolean(value))}
          className="mt-0.5 cursor-pointer rounded-full"
          aria-label={`Mark ${event.title} ${completed ? "incomplete" : "complete"}`}
        />
        <RehabEventKindIcon event={event} size="md" className="mt-0.5" />
        <button
          type="button"
          onClick={onEdit}
          className="min-w-0 flex-1 cursor-pointer text-left"
        >
          <p
            className={cn(
              "flex items-center gap-1.5 text-sm font-medium leading-snug",
              completed && "text-muted-foreground line-through",
              missed && "text-muted-foreground",
            )}
          >
            <span className="min-w-0 truncate">{event.title}</span>
            <RehabRecurringIcon event={event} />
          </p>
          <div className="mt-0.5 flex items-center gap-2">
            {missed ? (
              <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                Missed
              </span>
            ) : null}
            {timeLabel ? (
              <p className="text-muted-foreground text-xs tabular-nums">
                {timeLabel}
              </p>
            ) : null}
          </div>
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="text-muted-foreground hover:text-foreground mt-0.5 shrink-0 cursor-pointer rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
          aria-label={`Remove ${event.title}`}
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      {hasSubtasks ? (
        <div className="border-border bg-muted/30 mt-2 ml-[3.25rem] rounded-lg border p-3">
          <RehabEventSubtaskChecklist
            event={event}
            showMasterCheckbox={false}
            onToggleSubtask={handleSubtaskToggle}
            onToggleAll={(next, done) => onToggleAllSubtasks(next, done)}
          />
        </div>
      ) : null}
    </div>
  );
}
