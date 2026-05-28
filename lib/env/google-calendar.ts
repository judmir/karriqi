const emptyToUndefined = (v: unknown) =>
  v === "" || v === undefined ? undefined : v;

export function isGoogleCalendarConfigured(): boolean {
  const clientId = emptyToUndefined(process.env.GOOGLE_CLIENT_ID);
  const clientSecret = emptyToUndefined(process.env.GOOGLE_CLIENT_SECRET);
  return Boolean(
    typeof clientId === "string" &&
      clientId.length > 0 &&
      typeof clientSecret === "string" &&
      clientSecret.length > 0,
  );
}

export function getGoogleOAuthCredentials(): {
  clientId: string;
  clientSecret: string;
} | null {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return null;
  }
  return { clientId, clientSecret };
}

export function buildGoogleRedirectUri(origin: string): string {
  return `${origin.replace(/\/$/, "")}/api/integrations/google/calendar/callback`;
}

export function getOAuthStateSecret(): string | null {
  const pepper = process.env.AUTH_PIN_PEPPER?.trim();
  if (pepper && pepper.length >= 16) {
    return pepper;
  }
  const fallback = process.env.GOOGLE_OAUTH_STATE_SECRET?.trim();
  return fallback && fallback.length >= 16 ? fallback : null;
}
