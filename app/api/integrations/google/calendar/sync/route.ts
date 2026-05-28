import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { ROUTES } from "@/config/routes";
import { isGoogleCalendarConfigured } from "@/lib/env/google-calendar";
import { syncGoogleCalendarForUser } from "@/lib/google-calendar/sync";
import { getSessionUser } from "@/lib/supabase/server";

export async function POST() {
  if (!isGoogleCalendarConfigured()) {
    return NextResponse.json(
      { error: "Google Calendar is not configured." },
      { status: 501 },
    );
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  try {
    const result = await syncGoogleCalendarForUser(user.id);
    revalidatePath(ROUTES.calendar);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Sync failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
