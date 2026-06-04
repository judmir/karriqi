import { NextResponse } from "next/server";

import { runRuleOf3TomorrowReminderNotifications } from "@/lib/notifications/rule-of-3-tomorrow-reminder";

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

  const result = await runRuleOf3TomorrowReminderNotifications();
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  return handle(request);
}

/** Same contract as POST for schedulers that only issue GET (e.g. some cron UIs). */
export async function GET(request: Request) {
  return handle(request);
}
