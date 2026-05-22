import { describe, expect, it } from "vitest";
import { parse, stringify } from "yaml";

import { generateIngestOpenApiDocument } from "@/modules/ingest/openapi/document";
import { INGEST_ROUTE_PATHS } from "@/modules/ingest/routes";

describe("openapi.yaml contract", () => {
  it("YAML parse round-trips the generated document with all ingest paths", () => {
    const doc = generateIngestOpenApiDocument();
    const parsed = parse(stringify(doc)) as { paths: Record<string, unknown> };

    for (const path of INGEST_ROUTE_PATHS) {
      expect(parsed.paths[path]).toBeDefined();
    }
  });
});
