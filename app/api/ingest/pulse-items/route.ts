import { handleIngestPost } from "@/lib/ingest/route-handler";
import { ingestPulseItems } from "@/lib/repositories/ingest/pulse-items";
import { pulseItemsIngestSchema } from "@/modules/ingest/schemas/pulse-items";

export async function POST(request: Request) {
  return handleIngestPost(request, pulseItemsIngestSchema, ingestPulseItems);
}
