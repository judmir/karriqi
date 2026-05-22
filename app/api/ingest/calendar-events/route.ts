import { handleIngestPost } from "@/lib/ingest/route-handler";
import { ingestCalendarEvents } from "@/lib/repositories/ingest/calendar-events";
import { calendarEventsIngestSchema } from "@/modules/ingest/schemas/calendar-events";

export async function POST(request: Request) {
  return handleIngestPost(request, calendarEventsIngestSchema, ingestCalendarEvents);
}
