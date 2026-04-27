import { PageContainer } from "@/components/layout/page-container";
import { PlaceholderPage } from "@/components/patterns/placeholder-page";

export default function DashboardPage() {
  return (
    <PageContainer width="wide">
      <PlaceholderPage
        eyebrow="Overview"
        title="Dashboard"
        description="A calm home for your family’s modules. Use the navigation to explore placeholders for each area."
      />
    </PageContainer>
  );
}
