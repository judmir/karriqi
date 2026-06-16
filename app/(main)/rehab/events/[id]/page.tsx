import { RehabEventPageView } from "@/components/rehab/rehab-event-page-view";
import { RehabPlanStoreGate } from "@/components/rehab/rehab-plan-store-gate";
import { type RehabEventReturnTo } from "@/config/routes";

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

  return (
    <RehabPlanStoreGate>
      <RehabEventPageView eventId={id} returnTo={parseReturnTo(from)} />
    </RehabPlanStoreGate>
  );
}
