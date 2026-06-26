import { addDays, endOfDay, startOfDay } from "date-fns";

import { expandRehabEvents } from "@/lib/rehab/expand-rehab-events";
import { fetchRehabPlanEventsForUser } from "@/lib/rehab/fetch-rehab-plan-events";
import { fetchStoicRehabCompletionsForUser } from "@/lib/rehab/fetch-stoic-rehab";
import { mapRehabPlanEvent } from "@/lib/rehab/rehab-plan-event-map";
import {
  maxUpcomingDaysFrom,
  paginateUpcomingSearchItems,
  searchUpcomingItems,
  UPCOMING_SEARCH_PAGE_SIZE,
  type UpcomingKindFilterId,
  type UpcomingSearchPage,
} from "@/lib/rehab/rehab-upcoming-utils";
import { injectStoicPathEventsForRange } from "@/lib/rehab/stoic-rehab-utils";
import { PROGRAM_START } from "@/modules/rehab/neuro-rehab-2026/constants";
import { generateNeuroRehabProgramEvents } from "@/modules/rehab/neuro-rehab-2026/generate-program-events";
import { getSessionUser } from "@/lib/supabase/server";

export type FetchUpcomingSearchInput = {
  query?: string;
  kindFilters?: UpcomingKindFilterId[];
  offset?: number;
  limit?: number;
};

async function expandedUpcomingEventsForSearch() {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Not signed in.");
  }

  const [allEvents, stoicCompletions] = await Promise.all([
    fetchRehabPlanEventsForUser(),
    fetchStoicRehabCompletionsForUser(user.id),
  ]);

  const now = new Date();
  const windowStart = startOfDay(addDays(PROGRAM_START, -1));
  const windowEnd = endOfDay(
    addDays(startOfDay(now), maxUpcomingDaysFrom(now, allEvents)),
  );
  const expanded = expandRehabEvents(allEvents, windowStart, windowEnd);
  return injectStoicPathEventsForRange(
    expanded,
    windowStart,
    windowEnd,
    stoicCompletions,
  );
}

function expandedDemoEventsForSearch() {
  const mockRows = generateNeuroRehabProgramEvents("local");
  const allEvents = mockRows.map((row, index) =>
    mapRehabPlanEvent({
      id: `demo-${index}`,
      user_id: "local",
      title: row.title,
      description: row.description ?? null,
      start_at: row.start_at,
      end_at: row.end_at,
      all_day: row.all_day ?? false,
      color: row.color ?? "blue",
      completed_at: null,
      event_kind: row.event_kind,
      program_id: row.program_id,
      plan_week: row.plan_week,
      series_id: row.series_id ?? null,
      recurrence_rule: row.recurrence_rule ?? null,
      recurrence_at: row.recurrence_at ?? null,
      recurrence_cancelled: row.recurrence_cancelled ?? false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  );

  const now = new Date();
  const windowStart = startOfDay(addDays(PROGRAM_START, -1));
  const windowEnd = endOfDay(
    addDays(startOfDay(now), maxUpcomingDaysFrom(now, allEvents)),
  );
  const expanded = expandRehabEvents(allEvents, windowStart, windowEnd);
  return injectStoicPathEventsForRange(
    expanded,
    windowStart,
    windowEnd,
    [],
  );
}

export async function fetchUpcomingSearchPage(
  input: FetchUpcomingSearchInput,
  options: { demo?: boolean } = {},
): Promise<UpcomingSearchPage> {
  const offset = input.offset ?? 0;
  const limit = input.limit ?? UPCOMING_SEARCH_PAGE_SIZE;
  const expanded = options.demo
    ? expandedDemoEventsForSearch()
    : await expandedUpcomingEventsForSearch();
  const allItems = searchUpcomingItems(expanded, {
    query: input.query ?? "",
    kindFilters: input.kindFilters ?? [],
  });
  return paginateUpcomingSearchItems(allItems, offset, limit);
}
