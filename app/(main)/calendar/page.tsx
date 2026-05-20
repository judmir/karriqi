import { CalendarClient } from "@/components/calendar/calendar-client";
import { PageContainer } from "@/components/layout/page-container";
import { fetchCalendarEventsForUser } from "@/lib/calendar/fetch-calendar-events";
import { isSupabaseConfigured } from "@/lib/env";
import { getSessionUser } from "@/lib/supabase/server";
import type { CalendarEvent } from "@/types/calendar";

export default async function CalendarPage() {
  let events: CalendarEvent[] = [];
  let persistence = false;

  if (isSupabaseConfigured()) {
    const user = await getSessionUser();
    if (user) {
      try {
        events = await fetchCalendarEventsForUser();
        persistence = true;
      } catch {
        events = [];
      }
    }
  }

  return (
    <PageContainer width="wide">
      <CalendarClient initialEvents={events} persistence={persistence} />
    </PageContainer>
  );
}
