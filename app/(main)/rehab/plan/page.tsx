import { Suspense } from "react";
import { redirect } from "next/navigation";

import { RehabPlanStoreGate } from "@/components/rehab/rehab-plan-store-gate";
import { RehabUpcomingView } from "@/components/rehab/rehab-upcoming-view";
import { ROUTES } from "@/config/routes";
import { ensureNeuroRehabProgramReady } from "@/lib/rehab/ensure-neuro-rehab-program";
import { isSupabaseConfigured } from "@/lib/env";
import { getSessionUser } from "@/lib/supabase/server";

export default async function RehabUpcomingPage() {
  if (isSupabaseConfigured()) {
    const user = await getSessionUser();
    if (!user) {
      redirect(
        `${ROUTES.signIn}?next=${encodeURIComponent(ROUTES.rehabPlan)}`,
      );
    }
    await ensureNeuroRehabProgramReady(user.id);
  }

  return (
    <Suspense fallback={null}>
      <RehabPlanStoreGate>
        <RehabUpcomingView />
      </RehabPlanStoreGate>
    </Suspense>
  );
}
