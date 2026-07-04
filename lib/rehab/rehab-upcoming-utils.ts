import {
  addDays,
  differenceInCalendarDays,
  endOfDay,
  format,
  isSameDay,
  parseISO,
  startOfDay,
  startOfMonth,
} from "date-fns";

import { eventSpansDay } from "@/lib/calendar/all-day-events";
import { getEventDescriptionPlainText } from "@/lib/calendar/event-subtasks";
import { rehabEventKindPickerVisual } from "@/lib/rehab/rehab-event-kind-visual";
import type { RehabEventKind, RehabPlanEvent, RehabSpeechRecording } from "@/types/rehab";
import { PROGRAM_START } from "@/modules/rehab/neuro-rehab-2026/constants";

/** Filler words users often type that should not block kind/title matches. */
const UPCOMING_SEARCH_STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "event",
  "events",
  "task",
  "tasks",
]);


export const UPCOMING_SEARCH_PAGE_SIZE = 25;

export type UpcomingSearchPage = {
  items: UpcomingSearchItem[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
};

export function paginateUpcomingSearchItems(
  items: UpcomingSearchItem[],
  offset = 0,
  limit: number = UPCOMING_SEARCH_PAGE_SIZE,
): UpcomingSearchPage {
  const total = items.length;
  const pageItems = items.slice(offset, offset + limit);
  return {
    items: pageItems,
    total,
    offset,
    limit,
    hasMore: offset + pageItems.length < total,
  };
}

export function formatUpcomingSearchResultsLabel(input: {
  shown: number;
  total: number;
  summary: string | null;
}): string {
  const { shown, total, summary } = input;
  const countPart =
    total === 0
      ? "0 results"
      : shown >= total
        ? `${total} result${total === 1 ? "" : "s"}`
        : `${shown} of ${total} results`;
  return summary ? `${countPart} · ${summary}` : countPart;
}

export const UPCOMING_KIND_FILTER_IDS = [
  "run",
  "gym",
  "speech",
  "hand",
  "football",
  "meditation",
  "journal",
  "mobility",
  "stoic",
  "strength",
] as const;

export type UpcomingKindFilterId = (typeof UPCOMING_KIND_FILTER_IDS)[number];

export const UPCOMING_KIND_FILTERS: Record<
  UpcomingKindFilterId,
  { label: string; kinds: RehabEventKind[] }
> = {
  run: { label: "Run", kinds: ["run_walk"] },
  gym: { label: "Gym", kinds: ["gym_a", "gym_b", "gym_c", "gym_d"] },
  speech: { label: "Speech", kinds: ["speech"] },
  hand: { label: "Hand", kinds: ["hand"] },
  football: { label: "Football", kinds: ["football"] },
  meditation: { label: "Meditation", kinds: ["meditation"] },
  journal: { label: "Journal", kinds: ["journal"] },
  mobility: { label: "Mobility", kinds: ["mobility"] },
  stoic: { label: "Stoicism", kinds: ["stoic"] },
  strength: { label: "Strength", kinds: ["push_up", "squat", "crunch"] },
};

export type UpcomingSearchOptions = {
  query?: string;
  kindFilters?: UpcomingKindFilterId[];
};

export type UpcomingSearchItem =
  | { kind: "event"; event: RehabPlanEvent }
  | {
      kind: "recording";
      event: RehabPlanEvent;
      recording: RehabSpeechRecording;
    };


function eventMatchesKindFilters(
  event: RehabPlanEvent,
  kindFilters: UpcomingKindFilterId[],
): boolean {
  if (kindFilters.length === 0) {
    return true;
  }
  return kindFilters.some((filterId) =>
    UPCOMING_KIND_FILTERS[filterId].kinds.includes(event.eventKind),
  );
}

function isSpeechRelatedKindFilter(
  kindFilters: UpcomingKindFilterId[],
): boolean {
  return kindFilters.includes("speech");
}

function normalizeUpcomingSearchOptions(
  options: string | UpcomingSearchOptions,
): UpcomingSearchOptions {
  if (typeof options === "string") {
    return { query: options, kindFilters: [] };
  }
  return {
    query: options.query ?? "",
    kindFilters: options.kindFilters ?? [],
  };
}

function tokenizeUpcomingSearchQuery(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.replace(/[^\p{L}\p{N}]+/gu, ""))
    .filter((token) => token.length > 0 && !UPCOMING_SEARCH_STOP_WORDS.has(token));
}

function eventKindMatchesToken(kind: RehabEventKind, token: string): boolean {
  if (kind.includes(token)) {
    return true;
  }
  if (token === "gym" && kind.startsWith("gym_")) {
    return true;
  }
  if (token === "run" && kind === "run_walk") {
    return true;
  }
  const label = rehabEventKindPickerVisual(kind).label.toLowerCase();
  return label.includes(token) || token.includes(label);
}

function recordingMatchesToken(
  recording: RehabSpeechRecording,
  token: string,
): boolean {
  const fileName = recording.fileName.toLowerCase();
  const note = recording.note?.toLowerCase() ?? "";
  return (
    fileName.includes(token) ||
    note.includes(token) ||
    token === "recording" ||
    token === "recordings"
  );
}

function eventMatchesUpcomingSearchToken(
  event: RehabPlanEvent,
  token: string,
): boolean {
  const title = event.title.toLowerCase();
  const description =
    getEventDescriptionPlainText(event.description)?.toLowerCase() ?? "";
  return (
    title.includes(token) ||
    description.includes(token) ||
    eventKindMatchesToken(event.eventKind, token)
  );
}

function eventMatchesUpcomingSearch(
  event: RehabPlanEvent,
  tokens: string[],
): boolean {
  if (tokens.length === 0) {
    return false;
  }
  return tokens.every((token) => eventMatchesUpcomingSearchToken(event, token));
}

function isSpeechRelatedSearch(tokens: string[]): boolean {
  return tokens.some(
    (token) =>
      token === "speech" ||
      token === "recording" ||
      token === "recordings" ||
      token === "voice" ||
      token === "audio",
  );
}

function recordingMatchesUpcomingSearch(
  recording: RehabSpeechRecording,
  tokens: string[],
): boolean {
  if (tokens.length === 0) {
    return false;
  }
  return tokens.every((token) => recordingMatchesToken(recording, token));
}

function upcomingSearchItemSortKey(item: UpcomingSearchItem): number {
  if (item.kind === "recording") {
    return new Date(item.recording.createdAt).getTime();
  }
  return new Date(item.event.startAt).getTime();
}

/** Past day rows shown above today (yesterday only). */
export const UPCOMING_PAST_DAYS = 1;

/** Day rows after today in the list (tomorrow only). Today is always included. */
export const UPCOMING_FUTURE_DAYS_INITIAL = 1;

/** Each "See more" adds this many future day rows. */
export const UPCOMING_FUTURE_DAYS_CHUNK = 3;

/** @deprecated Use UPCOMING_FUTURE_DAYS_CHUNK */
export const UPCOMING_DAYS_CHUNK = UPCOMING_FUTURE_DAYS_CHUNK;

/** @deprecated Use UPCOMING_FUTURE_DAYS_INITIAL */
export const UPCOMING_INITIAL_DAYS = UPCOMING_FUTURE_DAYS_INITIAL;

/** @deprecated Use UPCOMING_FUTURE_DAYS_INITIAL */
export const UPCOMING_NEAR_DAYS = UPCOMING_FUTURE_DAYS_INITIAL;

/**
 * One row per calendar day. `isPast` days are before today and rendered
 * collapsed with a "past" highlight (like the calendar), so the user can
 * open them to review what was done / missed on that day.
 */
export type UpcomingListSection = {
  kind: "day";
  date: Date;
  label: string;
  events: RehabPlanEvent[];
  isPast: boolean;
};

function byStart(a: RehabPlanEvent, b: RehabPlanEvent): number {
  return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
}

function eventPrimaryDay(event: RehabPlanEvent): Date {
  if (event.allDay) {
    const [year, month, day] = event.startAt
      .slice(0, 10)
      .split("-")
      .map(Number);
    return new Date(year!, month! - 1, day!);
  }
  return startOfDay(parseISO(event.startAt));
}

function parseUntilDay(until: string): Date {
  const [year, month, day] = until.slice(0, 10).split("-").map(Number);
  return new Date(year!, month! - 1, day!);
}

/** Latest calendar day covered by stored rehab events (DB source of truth). */
export function programEndFromEvents(events: RehabPlanEvent[]): Date | null {
  let latest: Date | null = null;

  for (const event of events) {
    const candidates = [eventPrimaryDay(event)];
    if (event.recurrence?.until) {
      candidates.push(parseUntilDay(event.recurrence.until));
    }

    for (const day of candidates) {
      if (!latest || day.getTime() > latest.getTime()) {
        latest = day;
      }
    }
  }

  return latest;
}

export function upcomingEventScheduleLabel(
  event: RehabPlanEvent,
  now: Date = new Date(),
): string {
  const today = startOfDay(now);
  const datePart = upcomingDayLabel(eventPrimaryDay(event), today);
  if (event.allDay || event.completedAt) {
    return datePart;
  }
  return `${datePart} · ${format(parseISO(event.startAt), "HH:mm")}`;
}

/** Match title, description, event kind, or recording metadata across all events. */
export function filterUpcomingEventsBySearch(
  events: RehabPlanEvent[],
  query: string,
): RehabPlanEvent[] {
  const tokens = tokenizeUpcomingSearchQuery(query);
  if (tokens.length === 0) {
    return [];
  }

  return events
    .filter((event) => eventMatchesUpcomingSearch(event, tokens))
    .sort(byStart);
}

/** Events plus speech recordings for the upcoming search list. */
export function searchUpcomingItems(
  events: RehabPlanEvent[],
  options: string | UpcomingSearchOptions = "",
): UpcomingSearchItem[] {
  const { query = "", kindFilters = [] } =
    normalizeUpcomingSearchOptions(options);
  const tokens = tokenizeUpcomingSearchQuery(query);
  const hasText = tokens.length > 0;
  const hasFilters = kindFilters.length > 0;

  if (!hasText && !hasFilters) {
    return [];
  }

  const matchedEvents = events.filter((event) => {
    const kindOk = eventMatchesKindFilters(event, kindFilters);
    const textOk = hasText ? eventMatchesUpcomingSearch(event, tokens) : true;
    if (!hasFilters) {
      return textOk;
    }
    if (!hasText) {
      return kindOk;
    }
    return kindOk && textOk;
  });
  const items: UpcomingSearchItem[] = matchedEvents.map((event) => ({
    kind: "event",
    event,
  }));

  const speechRelated =
    isSpeechRelatedSearch(tokens) || isSpeechRelatedKindFilter(kindFilters);
  const seenRecordingIds = new Set<string>();

  for (const event of events) {
    if (event.eventKind !== "speech" || event.speechRecordings.length === 0) {
      continue;
    }

    const eventInResults = matchedEvents.some(
      (matched) => matched.id === event.id,
    );

    for (const recording of event.speechRecordings) {
      if (seenRecordingIds.has(recording.id)) {
        continue;
      }

      const includeRecording =
        (hasText && recordingMatchesUpcomingSearch(recording, tokens)) ||
        (speechRelated && eventInResults);

      if (!includeRecording) {
        continue;
      }

      seenRecordingIds.add(recording.id);
      items.push({ kind: "recording", event, recording });
    }
  }

  return items.sort(
    (a, b) => upcomingSearchItemSortKey(a) - upcomingSearchItemSortKey(b),
  );
}

export function upcomingSearchSummaryLabel(
  options: UpcomingSearchOptions,
): string | null {
  const { query = "", kindFilters = [] } = options;
  const labels = kindFilters.map((id) => UPCOMING_KIND_FILTERS[id].label);
  const trimmed = query.trim();

  if (labels.length > 0 && trimmed) {
    return `${labels.join(", ")} · “${trimmed}”`;
  }
  if (labels.length > 0) {
    return labels.join(", ");
  }
  if (trimmed) {
    return `“${trimmed}”`;
  }
  return null;
}

export function upcomingDayLabel(date: Date, today: Date): string {
  const tomorrow = addDays(today, 1);
  const yesterday = addDays(today, -1);
  if (isSameDay(date, today)) {
    return `Today ${format(date, "d MMM")}`;
  }
  if (isSameDay(date, tomorrow)) {
    return `Tomorrow ${format(date, "d MMM")}`;
  }
  if (isSameDay(date, yesterday)) {
    return `Yesterday ${format(date, "d MMM")}`;
  }
  return format(date, "EEE d MMM");
}

/** Number of past program days (program start → yesterday) available today. */
export function pastUpcomingDayCount(now: Date = new Date()): number {
  const today = startOfDay(now);
  const programStart = startOfDay(PROGRAM_START);
  return Math.max(0, differenceInCalendarDays(today, programStart));
}

/** Number of future day rows after today available through program end. */
export function maxFutureDaysAfterToday(
  now: Date = new Date(),
  events: RehabPlanEvent[] = [],
): number {
  const today = startOfDay(now);
  const programEnd = programEndFromEvents(events);
  if (!programEnd) {
    return UPCOMING_FUTURE_DAYS_INITIAL;
  }
  return Math.max(0, differenceInCalendarDays(programEnd, today));
}

/** @deprecated Use maxFutureDaysAfterToday */
export function maxUpcomingDaysFrom(
  now: Date = new Date(),
  events: RehabPlanEvent[] = [],
): number {
  return maxFutureDaysAfterToday(now, events);
}

export function upcomingListExpandWindow(
  now: Date = new Date(),
  visibleFutureDays: number = UPCOMING_FUTURE_DAYS_INITIAL,
): { start: Date; end: Date } {
  const today = startOfDay(now);
  return {
    start: startOfDay(addDays(today, -UPCOMING_PAST_DAYS)),
    end: endOfDay(addDays(today, visibleFutureDays)),
  };
}

export function hasMoreUpcomingDays(
  visibleFutureDays: number,
  now: Date = new Date(),
  events: RehabPlanEvent[] = [],
): boolean {
  return visibleFutureDays < maxFutureDaysAfterToday(now, events);
}

export function nextUpcomingVisibleDays(
  current: number,
  now: Date = new Date(),
  events: RehabPlanEvent[] = [],
): number {
  return Math.min(
    current + UPCOMING_FUTURE_DAYS_CHUNK,
    maxFutureDaysAfterToday(now, events),
  );
}

/**
 * One row per calendar day: last {@link UPCOMING_PAST_DAYS} past days (with
 * events), then today through {@link visibleFutureDays} days ahead. Past days
 * are flagged `isPast` for collapsed review UI.
 */
export function buildUpcomingListSections(
  events: RehabPlanEvent[],
  now: Date = new Date(),
  visibleFutureDays: number = UPCOMING_FUTURE_DAYS_INITIAL,
): UpcomingListSection[] {
  const today = startOfDay(now);
  const sections: UpcomingListSection[] = [];

  for (let i = UPCOMING_PAST_DAYS; i >= 1; i--) {
    const date = addDays(today, -i);
    const dayEvents = events
      .filter((event) => eventSpansDay(event, date))
      .sort(byStart);
    if (dayEvents.length === 0) {
      continue;
    }
    sections.push({
      kind: "day",
      date,
      label: upcomingDayLabel(date, today),
      events: dayEvents,
      isPast: true,
    });
  }

  const futureDayCount = Math.min(
    visibleFutureDays,
    maxFutureDaysAfterToday(now, events),
  );
  for (let offset = 0; offset <= futureDayCount; offset++) {
    const date = addDays(today, offset);
    const dayEvents = events
      .filter((event) => eventSpansDay(event, date))
      .sort(byStart);

    sections.push({
      kind: "day",
      date,
      label: upcomingDayLabel(date, today),
      events: dayEvents,
      isPast: false,
    });
  }

  return sections;
}

/** @deprecated Use buildUpcomingListSections with visibleFutureDays */
export function buildUpcomingNearSections(
  events: RehabPlanEvent[],
  now?: Date,
  visibleFutureDays?: number,
): UpcomingListSection[] {
  return buildUpcomingListSections(events, now, visibleFutureDays);
}

/** Default start when adding a task on a day row. */
export function defaultStartForUpcomingDay(day: Date): Date {
  const start = startOfDay(day);
  start.setHours(9, 0, 0, 0);
  return start;
}

/** @deprecated Month buckets removed; use defaultStartForUpcomingDay */
export function defaultStartForUpcomingMonth(month: Date): Date {
  const start = startOfMonth(month);
  start.setHours(9, 0, 0, 0);
  return start;
}
