import { type NextRequest, NextResponse } from "next/server";

import { ROUTES, isProtectedPath } from "@/config/routes";
import { canUseRehab, isRehabPath } from "@/lib/rehab/rehab-access";
import { updateSession } from "@/lib/supabase/middleware";

function safeNextPath(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return ROUTES.dashboard;
}

function redirectWithSessionCookies(
  url: URL,
  sessionResponse: NextResponse,
): NextResponse {
  const redirectResponse = NextResponse.redirect(url);
  for (const cookie of sessionResponse.cookies.getAll()) {
    redirectResponse.cookies.set(cookie);
  }
  return redirectResponse;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const protectedPath = isProtectedPath(pathname);

  if (pathname === ROUTES.home) {
    const { response, user } = await updateSession(request);
    const url = request.nextUrl.clone();
    url.pathname = user ? ROUTES.dashboard : ROUTES.signIn;
    url.search = "";
    return redirectWithSessionCookies(url, response);
  }

  if (!protectedPath && pathname !== ROUTES.signIn) {
    return NextResponse.next();
  }

  const { response, user } = await updateSession(request);

  if (protectedPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.signIn;
    const nextTarget = `${pathname}${request.nextUrl.search}`;
    url.searchParams.set("next", nextTarget);
    return redirectWithSessionCookies(url, response);
  }

  if (user && pathname === ROUTES.signIn) {
    const url = request.nextUrl.clone();
    url.pathname = safeNextPath(request.nextUrl.searchParams.get("next"));
    url.search = "";
    return redirectWithSessionCookies(url, response);
  }

  if (user && isRehabPath(pathname) && !canUseRehab(user)) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.dashboard;
    url.search = "";
    return redirectWithSessionCookies(url, response);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|workbox-.*|icons/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
