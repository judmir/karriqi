import { Suspense } from "react";
import { redirect } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { PulseFeedView } from "@/components/pulse/pulse-feed-view";
import { PulseStoreGate } from "@/components/pulse/pulse-store-gate";
import { ROUTES } from "@/config/routes";
import { isSupabaseConfigured } from "@/lib/env";
import { getSessionUser } from "@/lib/supabase/server";

export default async function PulsePage() {
  if (isSupabaseConfigured()) {
    const user = await getSessionUser();
    if (!user) {
      redirect(`${ROUTES.signIn}?next=${encodeURIComponent(ROUTES.pulse)}`);
    }
  }

  return (
    <PageContainer width="wide" className="px-0 md:px-0">
      <Suspense fallback={null}>
        <PulseStoreGate
          fallback={
            <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
              <div
                className="h-80 animate-pulse rounded-xl border border-border/60 bg-muted/20"
                aria-label="Loading Pulse"
                role="status"
              />
            </div>
          }
        >
          <PulseFeedView />
        </PulseStoreGate>
      </Suspense>
    </PageContainer>
  );
}
