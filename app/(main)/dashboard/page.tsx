import { WeekendOptionsCard } from "@/components/operator/weekend-options-card";
import { RuleOf3DashboardCard } from "@/components/rule-of-3/rule-of-3-dashboard-card";
import { RuleOf3StoreGate } from "@/components/rule-of-3/rule-of-3-store-gate";
import { PageContainer } from "@/components/layout/page-container";
import { isSupabaseConfigured } from "@/lib/env";
import { fetchCurrentWeekendPlannerForUser } from "@/lib/repositories/operator-entries";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import type { WeekendPlannerPayload } from "@/modules/operator/weekend-planner-schema";
import type { OperatorEntryRow } from "@/types/operator";

type WeekendCardProps =
  | { status: "empty" }
  | { status: "ready"; row: OperatorEntryRow; payload: WeekendPlannerPayload };

export default async function DashboardPage() {
  const user = await getSessionUser();
  let weekendCard: WeekendCardProps = { status: "empty" };

  if (user && isSupabaseConfigured()) {
    const supabase = await createClient();
    const entry = await fetchCurrentWeekendPlannerForUser(supabase, user.id);
    if (entry) {
      weekendCard = {
        status: "ready",
        row: entry.row,
        payload: entry.payload,
      };
    }
  }

  return (
    <PageContainer width="wide">
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <RuleOf3StoreGate
          fallback={
            <div
              className="h-64 animate-pulse rounded-xl border border-border/60 bg-muted/20"
              aria-label="Loading Rule of 3"
              role="status"
            />
          }
        >
          <RuleOf3DashboardCard />
        </RuleOf3StoreGate>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            What&apos;s next for your family this week.
          </p>
          <WeekendOptionsCard {...weekendCard} />
        </div>
      </div>
    </PageContainer>
  );
}
