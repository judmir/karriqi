import { type NextRequest, NextResponse } from "next/server";

import { ROUTES, isProtectedPath } from "@/config/routes";
import { updateSession } from "@/lib/supabase/middleware";

function safeNextPath(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return ROUTES.dashboard;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const protectedPath = isProtectedPath(pathname);

  if (!protectedPath && pathname !== ROUTES.signIn) {
    return NextResponse.next();
  }

  const { response, user } = await updateSession(request);

  if (protectedPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.signIn;
    const nextTarget = `${pathname}${request.nextUrl.search}`;
    url.searchParams.set("next", nextTarget);
    return NextResponse.redirect(url);
  }

  if (user && pathname === ROUTES.signIn) {
    const url = request.nextUrl.clone();
    url.pathname = safeNextPath(request.nextUrl.searchParams.get("next"));
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|workbox-.*|icons/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
