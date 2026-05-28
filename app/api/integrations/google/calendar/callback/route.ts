import { NextResponse } from "next/server";

import { ROUTES } from "@/config/routes";
import {
  upsertGoogleCalendarConnection,
} from "@/lib/google-calendar/connection";
import { GOOGLE_OAUTH_STATE_COOKIE } from "@/lib/google-calendar/constants";
import { fetchGooglePrimaryEmail } from "@/lib/google-calendar/client";
import {
  exchangeGoogleAuthCode,
} from "@/lib/google-calendar/oauth";
import { verifyGoogleOAuthState } from "@/lib/google-calendar/oauth-state";
import { syncGoogleCalendarForUser } from "@/lib/google-calendar/sync";
import { getSessionUser } from "@/lib/supabase/server";

function redirectWithError(request: Request, message: string): NextResponse {
  const url = new URL(ROUTES.calendar, request.url);
  url.searchParams.set("google_error", message);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.redirect(new URL(ROUTES.signIn, request.url));
  }

  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  if (error) {
    return redirectWithError(request, error);
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${GOOGLE_OAUTH_STATE_COOKIE}=`))
    ?.slice(`${GOOGLE_OAUTH_STATE_COOKIE}=`.length);

  if (!code || !state || !cookieState || state !== cookieState) {
    return redirectWithError(request, "Invalid OAuth state.");
  }

  if (!verifyGoogleOAuthState(state, user.id)) {
    return redirectWithError(request, "OAuth state verification failed.");
  }

  try {
    const origin = url.origin;
    const tokens = await exchangeGoogleAuthCode({ code, origin });

    if (!tokens.refresh_token) {
      return redirectWithError(
        request,
        "Google did not return a refresh token. Try disconnecting in Google Account settings and connect again.",
      );
    }

    const accessTokenExpiresAt = new Date(
      Date.now() + tokens.expires_in * 1000,
    ).toISOString();

    const googleEmail = await fetchGooglePrimaryEmail(tokens.access_token);

    await upsertGoogleCalendarConnection({
      userId: user.id,
      googleEmail,
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token,
      accessTokenExpiresAt,
    });

    await syncGoogleCalendarForUser(user.id);

    const successUrl = new URL(ROUTES.calendar, request.url);
    const response = NextResponse.redirect(successUrl);
    response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE);
    return response;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Google connection failed.";
    return redirectWithError(request, message);
  }
}
