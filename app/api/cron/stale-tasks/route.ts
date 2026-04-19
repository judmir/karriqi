import { NextResponse } from "next/server";

import { runStaleTaskNotifications } from "@/lib/notifications/stale-tasks";

function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not set" }, { status: 501 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return unauthorized();
  }

  const result = await runStaleTaskNotifications();
  return NextResponse.json(result);
}

/** Same contract as POST for schedulers that only issue GET (e.g. some cron UIs). */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not set" }, { status: 501 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return unauthorized();
  }

  const result = await runStaleTaskNotifications();
  return NextResponse.json(result);
}
