import { NextResponse } from "next/server";

import { canUseDevMenu } from "@/lib/dev/dev-access";
import { sendWebPushToUserIds } from "@/lib/push/send-web-push";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canUseDevMenu(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await sendWebPushToUserIds([user.id], {
    title: "Karriqi push test",
    body: "If you see this, web push delivery is working.",
    href: "/dev",
  });

  return NextResponse.json({ ok: true });
}
