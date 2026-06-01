import { NEURO_REHAB_PROGRAM_ID } from "@/modules/rehab/neuro-rehab-2026/constants";
import { createAdminClient } from "@/lib/supabase/admin";

export async function deleteAllProgramEventsForUser(
  userId: string,
  programId: string = NEURO_REHAB_PROGRAM_ID,
): Promise<void> {
  const admin = createAdminClient();
  if (!admin) {
    throw new Error("Server admin client not configured.");
  }

  const { error } = await admin
    .from("rehab_plan_events")
    .delete()
    .eq("user_id", userId)
    .eq("program_id", programId);

  if (error) {
    throw new Error(error.message);
  }
}
