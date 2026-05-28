import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { findDevTestUser } from "@/lib/auth/dev-test-users";
import { isDevLoginApiEnabled } from "@/lib/auth/local-dev-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  userId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  if (!isDevLoginApiEnabled()) {
    return NextResponse.json(
      { ok: false, message: "Dev sign-in is not available." },
      { status: 404 },
    );
  }

  let parsed: { userId: string };
  try {
    parsed = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid request." },
      { status: 400 },
    );
  }

  const devUser = findDevTestUser(parsed.userId);
  if (!devUser) {
    return NextResponse.json(
      { ok: false, message: "Unknown dev user." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { ok: false, message: "Server admin client not configured." },
      { status: 501 },
    );
  }

  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: devUser.email,
  });
  const tokenHash = linkData?.properties?.hashed_token;
  if (linkErr || !tokenHash) {
    return NextResponse.json(
      { ok: false, message: "Could not create dev session." },
      { status: 500 },
    );
  }

  const server = await createClient();
  const { error: verifyErr } = await server.auth.verifyOtp({
    type: "magiclink",
    token_hash: tokenHash,
  });
  if (verifyErr) {
    return NextResponse.json(
      { ok: false, message: verifyErr.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, email: devUser.email });
}
