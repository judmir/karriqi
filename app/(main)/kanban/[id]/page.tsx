import { notFound } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { TodoTaskPageView } from "@/components/todo/todo-task-page-view";
import { isUuid } from "@/lib/shopping/is-uuid";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function TodoTaskPage({ params }: Props) {
  const { id } = await params;

  if (!isUuid(id)) {
    notFound();
  }

  return (
    <PageContainer>
      <TodoTaskPageView taskId={id} />
    </PageContainer>
  );
}
