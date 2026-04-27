import { PageContainer } from "@/components/layout/page-container";
import { ListPlaceholder } from "@/components/patterns/list-placeholder";

export default function MainLoading() {
  return (
    <PageContainer width="wide">
      <div
        className="animate-pulse space-y-8"
        role="status"
        aria-label="Loading page"
      >
        <div className="space-y-3">
          <div className="bg-muted h-3 w-24 rounded-md" />
          <div className="bg-muted h-7 w-40 rounded-lg" />
        </div>
        <ListPlaceholder rows={5} />
      </div>
    </PageContainer>
  );
}
