import { NextResponse } from "next/server";

import { runRehabReminderNotifications } from "@/lib/notifications/rehab-reminders";

function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

async function handle(request: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not set" }, { status: 501 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return unauthorized();
  }

  const result = await runRehabReminderNotifications();
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  return handle(request);
}

/** Same contract as POST for schedulers that only issue GET (e.g. some cron UIs). */
export async function GET(request: Request) {
  return handle(request);
}
