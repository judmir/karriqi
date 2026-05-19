import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

// IP rate limit: an attacker can't pre-target a single account because PIN
// lookup is unauthenticated, so we ALSO throttle per IP. Per-user lockout
// (in user_pins) catches a focused attack against one account.
export const IP_MAX_FAILS = 10;
export const IP_LOCKOUT_MS = 15 * 60_000;

export const USER_MAX_FAILS = 5;
export const USER_LOCKOUT_MS = 15 * 60_000;

export function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export type IpLockState =
  | { kind: "locked"; lockoutUntil: Date }
  | { kind: "ok" };

export async function checkIpLock(
  admin: SupabaseClient<Database>,
  ip: string,
): Promise<IpLockState> {
  const { data } = await admin
    .from("pin_ip_attempts")
    .select("failed_count, lockout_until")
    .eq("ip", ip)
    .maybeSingle();
  if (!data) return { kind: "ok" };
  if (data.lockout_until && new Date(data.lockout_until).getTime() > Date.now()) {
    return { kind: "locked", lockoutUntil: new Date(data.lockout_until) };
  }
  return { kind: "ok" };
}

export async function recordIpFailure(
  admin: SupabaseClient<Database>,
  ip: string,
): Promise<void> {
  const { data } = await admin
    .from("pin_ip_attempts")
    .select("failed_count, lockout_until")
    .eq("ip", ip)
    .maybeSingle();
  const now = new Date();
  const previouslyLockedAndExpired =
    data?.lockout_until && new Date(data.lockout_until).getTime() <= now.getTime();
  const baseCount = previouslyLockedAndExpired ? 0 : (data?.failed_count ?? 0);
  const failedCount = baseCount + 1;
  const lockoutUntil =
    failedCount >= IP_MAX_FAILS
      ? new Date(now.getTime() + IP_LOCKOUT_MS).toISOString()
      : null;
  await admin
    .from("pin_ip_attempts")
    .upsert(
      {
        ip,
        failed_count: failedCount,
        lockout_until: lockoutUntil,
        last_attempt_at: now.toISOString(),
      },
      { onConflict: "ip" },
    );
}

export async function resetIpFailures(
  admin: SupabaseClient<Database>,
  ip: string,
): Promise<void> {
  await admin
    .from("pin_ip_attempts")
    .upsert(
      {
        ip,
        failed_count: 0,
        lockout_until: null,
        last_attempt_at: new Date().toISOString(),
      },
      { onConflict: "ip" },
    );
}
