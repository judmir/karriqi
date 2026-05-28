import { NextResponse } from "next/server";

import { ROUTES } from "@/config/routes";
import { isGoogleCalendarConfigured } from "@/lib/env/google-calendar";
import { buildGoogleAuthorizeUrl } from "@/lib/google-calendar/oauth";
import { createGoogleOAuthState } from "@/lib/google-calendar/oauth-state";
import { GOOGLE_OAUTH_STATE_COOKIE } from "@/lib/google-calendar/constants";
import { getSessionUser } from "@/lib/supabase/server";

export async function GET(request: Request) {
  if (!isGoogleCalendarConfigured()) {
    return NextResponse.json(
      { error: "Google Calendar is not configured on this server." },
      { status: 501 },
    );
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.redirect(new URL(ROUTES.signIn, request.url));
  }

  const state = createGoogleOAuthState(user.id);
  if (!state) {
    return NextResponse.json(
      {
        error:
          "OAuth state secret is not configured (set AUTH_PIN_PEPPER or GOOGLE_OAUTH_STATE_SECRET).",
      },
      { status: 501 },
    );
  }

  const origin = new URL(request.url).origin;
  const authorizeUrl = buildGoogleAuthorizeUrl({ origin, state });
  if (!authorizeUrl) {
    return NextResponse.json(
      { error: "Could not build Google authorize URL." },
      { status: 500 },
    );
  }

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return response;
}
