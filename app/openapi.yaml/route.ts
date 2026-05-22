import { stringify } from "yaml";

import { generateIngestOpenApiDocument } from "@/modules/ingest/openapi/document";

export const dynamic = "force-dynamic";

/** Same contract as `/openapi.json`, serialized as YAML for editors and Hermes. */
export async function GET() {
  const document = generateIngestOpenApiDocument();
  const yaml = stringify(document);

  return new Response(yaml, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/yaml; charset=utf-8",
    },
  });
}
