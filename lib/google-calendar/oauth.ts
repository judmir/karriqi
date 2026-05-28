import {
  buildGoogleRedirectUri,
  getGoogleOAuthCredentials,
} from "@/lib/env/google-calendar";
import {
  GOOGLE_CALENDAR_SCOPE,
  GOOGLE_OAUTH_AUTH_URL,
  GOOGLE_OAUTH_TOKEN_URL,
} from "@/lib/google-calendar/constants";

export type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type: string;
};

export function buildGoogleAuthorizeUrl(input: {
  origin: string;
  state: string;
}): string | null {
  const creds = getGoogleOAuthCredentials();
  if (!creds) {
    return null;
  }

  const redirectUri = buildGoogleRedirectUri(input.origin);
  const params = new URLSearchParams({
    client_id: creds.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_CALENDAR_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state: input.state,
  });

  return `${GOOGLE_OAUTH_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleAuthCode(input: {
  code: string;
  origin: string;
}): Promise<GoogleTokenResponse> {
  const creds = getGoogleOAuthCredentials();
  if (!creds) {
    throw new Error("Google Calendar OAuth is not configured.");
  }

  const redirectUri = buildGoogleRedirectUri(input.origin);
  const body = new URLSearchParams({
    code: input.code,
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const res = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = (await res.json()) as GoogleTokenResponse & {
    error?: string;
    error_description?: string;
  };

  if (!res.ok) {
    throw new Error(
      data.error_description ?? data.error ?? "Token exchange failed.",
    );
  }

  return data;
}

export async function refreshGoogleAccessToken(
  refreshToken: string,
): Promise<GoogleTokenResponse> {
  const creds = getGoogleOAuthCredentials();
  if (!creds) {
    throw new Error("Google Calendar OAuth is not configured.");
  }

  const body = new URLSearchParams({
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = (await res.json()) as GoogleTokenResponse & {
    error?: string;
    error_description?: string;
  };

  if (!res.ok) {
    throw new Error(
      data.error_description ?? data.error ?? "Token refresh failed.",
    );
  }

  return data;
}

export async function revokeGoogleToken(token: string): Promise<void> {
  await fetch(
    `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    },
  );
}
