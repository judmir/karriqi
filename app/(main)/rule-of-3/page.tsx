import { Suspense } from "react";
import { redirect } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { RuleOf3PlannerView } from "@/components/rule-of-3/rule-of-3-planner-view";
import { RuleOf3StoreGate } from "@/components/rule-of-3/rule-of-3-store-gate";
import { ROUTES } from "@/config/routes";
import { isSupabaseConfigured } from "@/lib/env";
import { getSessionUser } from "@/lib/supabase/server";

export default async function RuleOf3Page() {
  if (isSupabaseConfigured()) {
    const user = await getSessionUser();
    if (!user) {
      redirect(`${ROUTES.signIn}?next=${encodeURIComponent(ROUTES.ruleOfThree)}`);
    }
  }

  return (
    <PageContainer width="wide" className="px-0 md:px-0">
      <Suspense fallback={null}>
        <RuleOf3StoreGate
          fallback={
            <div className="mx-auto w-full max-w-2xl px-4 md:px-6">
              <div
                className="h-80 animate-pulse rounded-xl border border-border/60 bg-muted/20"
                aria-label="Loading Rule of 3"
                role="status"
              />
            </div>
          }
        >
          <RuleOf3PlannerView />
        </RuleOf3StoreGate>
      </Suspense>
    </PageContainer>
  );
}
