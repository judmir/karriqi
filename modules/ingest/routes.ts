/**
 * Canonical ingest HTTP paths. Used by route handlers, OpenAPI registration,
 * and sync tests — add a path here when introducing a new ingest resource.
 */
export const INGEST_ROUTE_PATHS = [
  "/api/ingest/shopping-list",
  "/api/ingest/kanban",
  "/api/ingest/calendar-events",
  "/api/ingest/pulse-items",
] as const;

export type IngestRoutePath = (typeof INGEST_ROUTE_PATHS)[number];

export const OPENAPI_JSON_PATH = "/openapi.json" as const;
export const OPENAPI_YAML_PATH = "/openapi.yaml" as const;
export const DEVELOPERS_DOCS_PATH = "/developers" as const;
