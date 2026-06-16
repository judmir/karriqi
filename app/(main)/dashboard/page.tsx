import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RehabTodayView } from "@/components/rehab/rehab-today-view";
import { RehabPlanStoreGate } from "@/components/rehab/rehab-plan-store-gate";
import { RuleOf3DashboardCard } from "@/components/rule-of-3/rule-of-3-dashboard-card";
import { RuleOf3StoreGate } from "@/components/rule-of-3/rule-of-3-store-gate";
import { PageContainer } from "@/components/layout/page-container";

export default function DashboardPage() {
  return (
    <PageContainer width="wide">
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <Card>
          <CardHeader className="gap-2 border-b border-border/60 pb-5">
            <CardTitle className="text-lg">Today</CardTitle>
            <CardDescription>
              Manage your rehab plan for today right here.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <RehabPlanStoreGate>
              <RehabTodayView />
            </RehabPlanStoreGate>
          </CardContent>
        </Card>
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
      </div>
    </PageContainer>
  );
}
