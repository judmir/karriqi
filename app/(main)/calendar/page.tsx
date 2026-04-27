import { PageContainer } from "@/components/layout/page-container";
import { PlaceholderPage } from "@/components/patterns/placeholder-page";

export default function CalendarPage() {
  return (
    <PageContainer width="wide">
      <PlaceholderPage
        eyebrow="Module"
        title="Calendar"
        description="Shared events and schedules will connect here when you build the calendar module."
      />
    </PageContainer>
  );
}
