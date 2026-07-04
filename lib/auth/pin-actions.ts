"use server";

import {
  PIN_MAX_LENGTH,
  PIN_MIN_LENGTH,
  computePinLookupHash,
  hashPin,
  isValidPin,
} from "@/lib/auth/pin-hash";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, getSessionUser } from "@/lib/supabase/server";

export type PinActionResult =
  | { ok: true }
  | { ok: false; message: string };

export type PinStatus = {
  hasPin: boolean;
  configured: boolean;
};

function pepperConfigured(): boolean {
  try {
    computePinLookupHash("0000");
    return true;
  } catch {
    return false;
  }
}

/** Server-side query the settings page uses to decide which UI to render. */
export async function getOwnPinStatus(): Promise<PinStatus> {
  const configured = pepperConfigured();
  if (!configured) return { hasPin: false, configured: false };

  // getClaims-based lookup: local JWT verification, no Auth server round-trip.
  const user = await getSessionUser();
  if (!user) return { hasPin: false, configured };

  const admin = createAdminClient();
  if (!admin) return { hasPin: false, configured: false };

  const { data } = await admin
    .from("user_pins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  return { hasPin: !!data, configured };
}

/**
 * Create or replace the caller's PIN. Validates format, enforces uniqueness
 * across the household (so PIN-only lookup can identify a single user), and
 * resets the lockout state.
 */
export async function setOwnPin(rawPin: string): Promise<PinActionResult> {
  if (!pepperConfigured()) {
    return {
      ok: false,
      message: "PIN sign-in is not configured on this server.",
    };
  }

  const pin = rawPin.trim();
  if (!isValidPin(pin)) {
    return {
      ok: false,
      message: `Use ${PIN_MIN_LENGTH}-${PIN_MAX_LENGTH} digits, numbers only.`,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false,
      message: "Server admin client not available (set SUPABASE_SERVICE_ROLE_KEY).",
    };
  }

  const lookupHash = computePinLookupHash(pin);

  // Reject if someone else already uses this PIN (PIN-only login needs the
  // lookup hash to identify a single user).
  const { data: collision } = await admin
    .from("user_pins")
    .select("user_id")
    .eq("pin_lookup_hash", lookupHash)
    .neq("user_id", user.id)
    .maybeSingle();
  if (collision) {
    return {
      ok: false,
      message: "That PIN is already in use. Pick a different one.",
    };
  }

  const hashed = await hashPin(pin);
  const now = new Date().toISOString();
  const { error } = await admin
    .from("user_pins")
    .upsert(
      {
        user_id: user.id,
        pin_lookup_hash: lookupHash,
        pin_hash: hashed,
        failed_count: 0,
        lockout_until: null,
        updated_at: now,
      },
      { onConflict: "user_id" },
    );
  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}

export async function removeOwnPin(): Promise<PinActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false,
      message: "Server admin client not available (set SUPABASE_SERVICE_ROLE_KEY).",
    };
  }

  const { error } = await admin
    .from("user_pins")
    .delete()
    .eq("user_id", user.id);
  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
}
