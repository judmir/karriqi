import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { INGEST_ROUTE_PATHS } from "@/modules/ingest/routes";
import { generateIngestOpenApiDocument } from "@/modules/ingest/openapi/registry";

function listIngestRouteDirs(): string[] {
  const base = join(process.cwd(), "app", "api", "ingest");
  return readdirSync(base).filter((name) => {
    const full = join(base, name);
    return statSync(full).isDirectory();
  });
}

describe("ingest OpenAPI contract sync", () => {
  it("documents every app/api/ingest/*/route.ts resource", () => {
    const dirs = listIngestRouteDirs();
    const documented = new Set(
      INGEST_ROUTE_PATHS.map((p) => p.replace("/api/ingest/", "")),
    );

    for (const dir of dirs) {
      expect(documented.has(dir), `missing INGEST_ROUTE_PATHS entry for ${dir}`).toBe(
        true,
      );
    }

    expect(documented.size).toBe(dirs.length);
  });

  it("includes all ingest paths in generated OpenAPI", () => {
    const doc = generateIngestOpenApiDocument() as {
      paths: Record<string, unknown>;
    };

    for (const path of INGEST_ROUTE_PATHS) {
      expect(doc.paths[path], `OpenAPI missing path ${path}`).toBeDefined();
      expect(doc.paths[path]).toHaveProperty("post");
    }
  });
});
