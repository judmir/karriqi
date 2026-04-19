import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Returns other household-linked auth user ids (via `household_members`), both
 * as list owner→member and member→owner edges. Requires service role.
 */
export async function getHouseholdPeerUserIds(userId: string): Promise<string[]> {
  const admin = createAdminClient();
  if (!admin) return [];

  const [{ data: asOwner }, { data: asMember }] = await Promise.all([
    admin
      .from("household_members")
      .select("member_user_id")
      .eq("owner_user_id", userId),
    admin
      .from("household_members")
      .select("owner_user_id")
      .eq("member_user_id", userId),
  ]);

  const ids = new Set<string>();
  for (const r of asOwner ?? []) {
    if (r.member_user_id) ids.add(r.member_user_id);
  }
  for (const r of asMember ?? []) {
    if (r.owner_user_id) ids.add(r.owner_user_id);
  }

  return [...ids];
}
