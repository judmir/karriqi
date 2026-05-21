import { KanbanPageView } from "@/components/todo/kanban-page-view";
import { PageContainer } from "@/components/layout/page-container";

export default function TodoPage() {
  return (
    <PageContainer width="wide">
      <KanbanPageView />
    </PageContainer>
  );
}
