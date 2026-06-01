import { Suspense } from "react";
import { redirect } from "next/navigation";

import { RehabClinicalStoreGate } from "@/components/rehab/rehab-clinical-store-gate";
import { RehabClinicalView } from "@/components/rehab/rehab-clinical-view";
import { ROUTES } from "@/config/routes";
import { isSupabaseConfigured } from "@/lib/env";
import { ensureRehabClinicalCatalogSeeded } from "@/lib/rehab/fetch-rehab-clinical";
import { getSessionUser } from "@/lib/supabase/server";

export default async function RehabClinicalPage() {
  if (isSupabaseConfigured()) {
    const user = await getSessionUser();
    if (!user) {
      redirect(
        `${ROUTES.signIn}?next=${encodeURIComponent(ROUTES.rehabClinical)}`,
      );
    }
    await ensureRehabClinicalCatalogSeeded();
  }

  return (
    <Suspense fallback={null}>
      <RehabClinicalStoreGate>
        <RehabClinicalView />
      </RehabClinicalStoreGate>
    </Suspense>
  );
}
