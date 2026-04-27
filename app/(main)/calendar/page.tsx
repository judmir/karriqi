import { PageContainer } from "@/components/layout/page-container";
import { PlaceholderPage } from "@/components/patterns/placeholder-page";

export default function CalendarPage() {
  return (
    <PageContainer width="wide">
      <PlaceholderPage segments={["Calendar"]} />
    </PageContainer>
  );
}
