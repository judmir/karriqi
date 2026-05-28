"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/config/routes";
import { fetchGoogleCalendarSourcesForUser, setGoogleCalendarSourceSelected } from "@/lib/google-calendar/calendar-sources";
import { getSessionUser } from "@/lib/supabase/server";
import type { GoogleCalendarSource } from "@/types/calendar";

export async function fetchGoogleCalendarSourcesAction(): Promise<
  GoogleCalendarSource[]
> {
  const user = await getSessionUser();
  if (!user) {
    return [];
  }

  return fetchGoogleCalendarSourcesForUser();
}

export async function toggleGoogleCalendarSourceAction(input: {
  googleCalendarId: string;
  selected: boolean;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  try {
    await setGoogleCalendarSourceSelected({
      userId: user.id,
      googleCalendarId: input.googleCalendarId,
      selected: input.selected,
    });
    revalidatePath(ROUTES.calendar);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Could not update calendar.",
    };
  }
}
