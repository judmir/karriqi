import { cache } from "react";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, getSessionUser } from "@/lib/supabase/server";

/**
 * Returns the canonical household owner uuid for the current session user.
 *
 * Mirrors the SQL `household_owner_for()` function: if the user is a `member_user_id`
 * in a `household_members` row, the owner_user_id from that row is returned;
 * otherwise the user is their own owner. Shopping list / staples / purchase events
 * are stored under this canonical id so both partners share one set of rows.
 *
 * Falls back to the user's own id on errors so the app still works for solo users.
 */
export const getHouseholdOwnerUserId = cache(
  async function getHouseholdOwnerUserId(): Promise<string | null> {
    const user = await getSessionUser();
    if (!user) return null;
    return resolveHouseholdOwnerUserId(user.id);
  },
);

/**
 * Pure resolver for a specific user id. Used from server actions where the
 * authenticated user has already been fetched.
 */
export async function resolveHouseholdOwnerUserId(
  userId: string,
): Promise<string> {
  const admin = createAdminClient();
  if (admin) {
    const { data, error } = await admin
      .from("household_members")
      .select("owner_user_id")
      .eq("member_user_id", userId)
      .limit(1)
      .maybeSingle();
    if (!error && data?.owner_user_id) {
      return data.owner_user_id;
    }
    return userId;
  }

  // No service role: rely on the SQL function (security definer bypasses RLS).
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("household_owner_for", {
      uid: userId,
    });
    if (!error && typeof data === "string" && data.length > 0) {
      return data;
    }
  } catch {
    // ignore — fall through to self
  }
  return userId;
}
