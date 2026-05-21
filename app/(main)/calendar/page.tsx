import { CalendarPageView } from "@/components/calendar/calendar-page-view";
import { PageContainer } from "@/components/layout/page-container";

export default function CalendarPage() {
  return (
    <PageContainer width="wide">
      <CalendarPageView />
    </PageContainer>
  );
}
