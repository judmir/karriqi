import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { ROUTES } from "@/config/routes";
import { deleteGoogleCalendarConnection } from "@/lib/google-calendar/connection";
import { revokeGoogleToken } from "@/lib/google-calendar/oauth";
import { getSessionUser } from "@/lib/supabase/server";

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const existing = await deleteGoogleCalendarConnection(user.id);
  if (existing?.refreshToken) {
    try {
      await revokeGoogleToken(existing.refreshToken);
    } catch {
      // Best-effort revoke; connection is already removed locally.
    }
  }

  revalidatePath(ROUTES.calendar);
  revalidatePath(ROUTES.settings);

  return NextResponse.json({ ok: true });
}
