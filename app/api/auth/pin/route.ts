import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { computePinLookupHash, isValidPin, verifyPin } from "@/lib/auth/pin-hash";
import {
  USER_LOCKOUT_MS,
  USER_MAX_FAILS,
  checkIpLock,
  clientIp,
  recordIpFailure,
  resetIpFailures,
} from "@/lib/auth/pin-rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ pin: z.string() });

// Never reveal whether the PIN was unknown, locked-out, or wrong. The client
// just sees a single generic failure message and a 429-style waiting hint.
function rejectGeneric(retryAfterSeconds?: number): NextResponse {
  const headers: Record<string, string> = {};
  if (retryAfterSeconds && retryAfterSeconds > 0) {
    headers["Retry-After"] = String(retryAfterSeconds);
  }
  return NextResponse.json(
    { ok: false, message: "Incorrect PIN. Try again in a moment." },
    { status: 401, headers },
  );
}

export async function POST(request: NextRequest) {
  let pepperConfigured = true;
  try {
    // Cheap probe to ensure server-only env vars are set before doing DB work.
    computePinLookupHash("0000");
  } catch {
    pepperConfigured = false;
  }
  if (!pepperConfigured) {
    return NextResponse.json(
      { ok: false, message: "PIN sign-in is not configured on this server." },
      { status: 501 },
    );
  }

  let parsed: { pin: string };
  try {
    const json = await request.json();
    parsed = bodySchema.parse(json);
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid request." },
      { status: 400 },
    );
  }

  const pin = parsed.pin.trim();
  if (!isValidPin(pin)) {
    return rejectGeneric();
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "PIN sign-in requires the Supabase service role key on the server.",
      },
      { status: 501 },
    );
  }

  const ip = clientIp(request);

  // Step 1: per-IP lockout window. Generic response even when locked, with
  // a Retry-After hint so the UI can render a friendly wait timer.
  const ipState = await checkIpLock(admin, ip);
  if (ipState.kind === "locked") {
    const seconds = Math.max(
      1,
      Math.ceil((ipState.lockoutUntil.getTime() - Date.now()) / 1000),
    );
    return rejectGeneric(seconds);
  }

  // Step 2: look up the candidate user by deterministic hash.
  const lookupHash = computePinLookupHash(pin);
  const { data: pinRow } = await admin
    .from("user_pins")
    .select("user_id, pin_hash, failed_count, lockout_until")
    .eq("pin_lookup_hash", lookupHash)
    .maybeSingle();

  if (!pinRow) {
    await recordIpFailure(admin, ip);
    return rejectGeneric();
  }

  // Per-user lockout.
  if (
    pinRow.lockout_until &&
    new Date(pinRow.lockout_until).getTime() > Date.now()
  ) {
    await recordIpFailure(admin, ip);
    const seconds = Math.max(
      1,
      Math.ceil(
        (new Date(pinRow.lockout_until).getTime() - Date.now()) / 1000,
      ),
    );
    return rejectGeneric(seconds);
  }

  // Step 3: slow-hash verification.
  const ok = await verifyPin(pin, pinRow.pin_hash);
  if (!ok) {
    const now = Date.now();
    const failedCount = (pinRow.failed_count ?? 0) + 1;
    const lockoutUntil =
      failedCount >= USER_MAX_FAILS
        ? new Date(now + USER_LOCKOUT_MS).toISOString()
        : null;
    await admin
      .from("user_pins")
      .update({
        failed_count: failedCount,
        lockout_until: lockoutUntil,
        updated_at: new Date(now).toISOString(),
      })
      .eq("user_id", pinRow.user_id);
    await recordIpFailure(admin, ip);
    return rejectGeneric();
  }

  // Step 4: PIN is correct. Mint a Supabase session for that user.
  const { data: userRes, error: userErr } = await admin.auth.admin.getUserById(
    pinRow.user_id,
  );
  const email = userRes?.user?.email;
  if (userErr || !email) {
    // Treat as failure to avoid leaking that the PIN matched but the user is
    // unusable for some reason.
    await recordIpFailure(admin, ip);
    return rejectGeneric();
  }

  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  const tokenHash = linkData?.properties?.hashed_token;
  if (linkErr || !tokenHash) {
    await recordIpFailure(admin, ip);
    return rejectGeneric();
  }

  const server = await createClient();
  const { error: verifyErr } = await server.auth.verifyOtp({
    type: "magiclink",
    token_hash: tokenHash,
  });
  if (verifyErr) {
    await recordIpFailure(admin, ip);
    return rejectGeneric();
  }

  // Reset failure counters now that we trust this caller.
  await admin
    .from("user_pins")
    .update({
      failed_count: 0,
      lockout_until: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", pinRow.user_id);
  await resetIpFailures(admin, ip);

  return NextResponse.json({ ok: true });
}
