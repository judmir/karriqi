import { Suspense } from "react";
import { redirect } from "next/navigation";

import { RehabPlanStoreGate } from "@/components/rehab/rehab-plan-store-gate";
import { RehabTodayView } from "@/components/rehab/rehab-today-view";
import { ROUTES } from "@/config/routes";
import { ensureNeuroRehabProgramReady } from "@/lib/rehab/ensure-neuro-rehab-program";
import { isSupabaseConfigured } from "@/lib/env";
import { getSessionUser } from "@/lib/supabase/server";

export default async function RehabTodayPage() {
  if (isSupabaseConfigured()) {
    const user = await getSessionUser();
    if (!user) {
      redirect(
        `${ROUTES.signIn}?next=${encodeURIComponent(ROUTES.rehabToday)}`,
      );
    }
    await ensureNeuroRehabProgramReady(user.id);
  }

  const journalDate = new Date().toISOString().slice(0, 10);

  return (
    <Suspense fallback={null}>
      <RehabPlanStoreGate>
        <RehabTodayView journalDate={journalDate} />
      </RehabPlanStoreGate>
    </Suspense>
  );
}
