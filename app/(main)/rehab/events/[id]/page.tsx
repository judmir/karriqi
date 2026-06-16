import { Suspense } from "react";
import { redirect } from "next/navigation";

import { RehabEventPageView } from "@/components/rehab/rehab-event-page-view";
import { RehabPlanStoreGate } from "@/components/rehab/rehab-plan-store-gate";
import { ROUTES, type RehabEventReturnTo } from "@/config/routes";
import { ensureNeuroRehabProgramReady } from "@/lib/rehab/ensure-neuro-rehab-program";
import { isSupabaseConfigured } from "@/lib/env";
import { getSessionUser } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
};

function parseReturnTo(value: string | undefined): RehabEventReturnTo | null {
  if (value === "today" || value === "history" || value === "plan") {
    return value;
  }
  return null;
}

export default async function RehabEventPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const { from } = await searchParams;

  if (isSupabaseConfigured()) {
    const user = await getSessionUser();
    if (!user) {
      redirect(
        `${ROUTES.signIn}?next=${encodeURIComponent(`/rehab/events/${encodeURIComponent(id)}${from ? `?from=${from}` : ""}`)}`,
      );
    }
    await ensureNeuroRehabProgramReady(user.id);
  }

  return (
    <Suspense fallback={null}>
      <RehabPlanStoreGate>
        <RehabEventPageView eventId={id} returnTo={parseReturnTo(from)} />
      </RehabPlanStoreGate>
    </Suspense>
  );
}
