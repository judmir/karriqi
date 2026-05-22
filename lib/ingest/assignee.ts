import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/** Whether `assigneeUserId` may be set on tasks for `ownerUserId` (ingest / server). */
export async function ingestAssigneeAllowed(
  ownerUserId: string,
  assigneeUserId: string | null,
): Promise<boolean> {
  if (assigneeUserId === null) return true;
  if (assigneeUserId === ownerUserId) return true;

  const admin = createAdminClient();
  if (admin) {
    const { data, error } = await admin.auth.admin.getUserById(assigneeUserId);
    return !error && Boolean(data.user);
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("household_members")
    .select("id")
    .eq("owner_user_id", ownerUserId)
    .eq("member_user_id", assigneeUserId)
    .maybeSingle();

  return Boolean(data);
}
