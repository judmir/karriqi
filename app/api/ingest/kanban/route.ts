import { handleIngestPost } from "@/lib/ingest/route-handler";
import { ingestKanbanTasks } from "@/lib/repositories/ingest/kanban";
import { kanbanIngestSchema } from "@/modules/ingest/schemas/kanban";

export async function POST(request: Request) {
  return handleIngestPost(request, kanbanIngestSchema, ingestKanbanTasks);
}
