import { Suspense } from "react";
import { redirect } from "next/navigation";

import { RehabHistoryView } from "@/components/rehab/rehab-history-view";
import { RehabPlanStoreGate } from "@/components/rehab/rehab-plan-store-gate";
import { ROUTES } from "@/config/routes";
import { ensureNeuroRehabProgramReady } from "@/lib/rehab/ensure-neuro-rehab-program";
import { isSupabaseConfigured } from "@/lib/env";
import { getSessionUser } from "@/lib/supabase/server";

export default async function RehabHistoryPage() {
  if (isSupabaseConfigured()) {
    const user = await getSessionUser();
    if (!user) {
      redirect(
        `${ROUTES.signIn}?next=${encodeURIComponent(ROUTES.rehabHistory)}`,
      );
    }
    await ensureNeuroRehabProgramReady(user.id);
  }

  return (
    <Suspense fallback={null}>
      <RehabPlanStoreGate>
        <RehabHistoryView />
      </RehabPlanStoreGate>
    </Suspense>
  );
}
