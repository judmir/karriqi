import { WeekendOptionsCard } from "@/components/operator/weekend-options-card";
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
        <header className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            What&apos;s next for your family this week.
          </p>
        </header>
        <WeekendOptionsCard {...weekendCard} />
      </div>
    </PageContainer>
  );
}
