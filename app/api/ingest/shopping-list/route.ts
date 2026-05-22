import { handleIngestPost } from "@/lib/ingest/route-handler";
import { ingestShoppingList } from "@/lib/repositories/ingest/shopping-list";
import { shoppingListIngestSchema } from "@/modules/ingest/schemas/shopping-list";

export async function POST(request: Request) {
  return handleIngestPost(request, shoppingListIngestSchema, ingestShoppingList);
}
