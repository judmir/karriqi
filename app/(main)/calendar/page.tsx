import { redirect } from "next/navigation";
import { Suspense } from "react";

import { CalendarConnectPrompt } from "@/components/calendar/calendar-connect-prompt";
import { CalendarPageView } from "@/components/calendar/calendar-page-view";
import { ROUTES } from "@/config/routes";
import { isCalendarReadOnly } from "@/lib/calendar/calendar-readonly";
import { fetchCalendarEventsForUser } from "@/lib/calendar/fetch-calendar-events";
import { isSupabaseConfigured } from "@/lib/env";
import { getGoogleCalendarConnectionStatus } from "@/lib/google-calendar/connection-actions";
import { fetchGoogleCalendarSourcesForUser } from "@/lib/google-calendar/calendar-sources";
import { getSessionUser } from "@/lib/supabase/server";

type CalendarPageProps = {
  searchParams: Promise<{ google_error?: string; google_connected?: string }>;
};

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <CalendarPageView />
      </div>
    );
  }

  const user = await getSessionUser();
  if (!user) {
    redirect(
      `${ROUTES.signIn}?next=${encodeURIComponent(ROUTES.calendar)}`,
    );
  }

  const status = await getGoogleCalendarConnectionStatus(user.id);
  if (!status.connected) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <Suspense fallback={null}>
          <CalendarConnectPrompt configured={status.configured} />
        </Suspense>
      </div>
    );
  }

  const [params, events, calendarSources] = await Promise.all([
    searchParams,
    fetchCalendarEventsForUser(),
    fetchGoogleCalendarSourcesForUser(),
  ]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <CalendarPageView
        initialEvents={events}
        calendarSources={calendarSources}
        lastSyncedAt={status.lastSyncedAt}
        googleEmail={status.googleEmail}
        googleError={params.google_error ?? null}
        syncOnMount={params.google_connected === "1"}
        readOnly={isCalendarReadOnly()}
      />
    </div>
  );
}
