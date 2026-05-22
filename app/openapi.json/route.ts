import { generateIngestOpenApiDocument } from "@/modules/ingest/openapi/document";

export const dynamic = "force-dynamic";

/** Public OpenAPI contract for Hermes and other ingest clients. */
export async function GET() {
  const document = generateIngestOpenApiDocument();
  return Response.json(document, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
