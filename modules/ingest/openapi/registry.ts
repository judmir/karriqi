import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";

import {
  INGEST_ROUTE_PATHS,
  OPENAPI_JSON_PATH,
} from "@/modules/ingest/routes";
import { calendarEventsIngestSchema } from "@/modules/ingest/schemas/calendar-events";
import { kanbanIngestSchema } from "@/modules/ingest/schemas/kanban";
import {
  ingestErrorResponseSchema,
  ingestSuccessResponseSchema,
} from "@/modules/ingest/schemas/responses";
import { shoppingListIngestSchema } from "@/modules/ingest/schemas/shopping-list";

import packageJson from "@/package.json";

import "@/modules/ingest/openapi/zod-openapi";

export const ingestOpenApiRegistry = new OpenAPIRegistry();

ingestOpenApiRegistry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  description:
    "Server-only `INGEST_TOKEN`. Send as `Authorization: Bearer <token>`.",
});

function registerIngestPost(
  path: (typeof INGEST_ROUTE_PATHS)[number],
  tag: string,
  summary: string,
  description: string,
  bodySchema:
    | typeof shoppingListIngestSchema
    | typeof kanbanIngestSchema
    | typeof calendarEventsIngestSchema,
) {
  ingestOpenApiRegistry.registerPath({
    method: "post",
    path,
    tags: [tag],
    summary,
    description,
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          "application/json": {
            schema: bodySchema,
          },
        },
        required: true,
      },
    },
    responses: {
      200: {
        description: "Rows created or updated.",
        content: {
          "application/json": {
            schema: ingestSuccessResponseSchema,
          },
        },
      },
      400: {
        description: "Invalid JSON or validation failed.",
        content: {
          "application/json": {
            schema: ingestErrorResponseSchema,
          },
        },
      },
      401: {
        description: "Missing or invalid Bearer token.",
        content: {
          "application/json": {
            schema: ingestErrorResponseSchema,
          },
        },
      },
      501: {
        description: "INGEST_TOKEN not configured on server.",
        content: {
          "application/json": {
            schema: ingestErrorResponseSchema,
          },
        },
      },
      500: {
        description: "Database or server error.",
        content: {
          "application/json": {
            schema: ingestErrorResponseSchema,
          },
        },
      },
    },
  });
}

registerIngestPost(
  "/api/ingest/shopping-list",
  "shopping-list",
  "Upsert shopping list items",
  "Adds or updates rows on the household shopping list. Resolves `userId` to the household owner (shared list).",
  shoppingListIngestSchema,
);

registerIngestPost(
  "/api/ingest/kanban",
  "kanban",
  "Create or update kanban tasks",
  "Creates or updates todo/kanban items for `userId`. Pass a stable `id` from your agent for idempotent upserts.",
  kanbanIngestSchema,
);

registerIngestPost(
  "/api/ingest/calendar-events",
  "calendar-events",
  "Create or update calendar events",
  "Creates or updates calendar events for `userId`. Pass a stable `id` for idempotent upserts.",
  calendarEventsIngestSchema,
);

export function generateIngestOpenApiDocument() {
  // OpenAPI 3.0 for Swagger UI compatibility (3.1 + Turbopack breaks apidom refract).
  const generator = new OpenApiGeneratorV3(ingestOpenApiRegistry.definitions);
  const appVersion = packageJson.version;

  return generator.generateDocument({
    openapi: "3.0.3",
    info: {
      title: "Karriqi Ingest API",
      version: appVersion,
      description: [
        "Machine ingest for third-party agents (e.g. Hermes).",
        "",
        "**Contract:** this OpenAPI document is the source of truth. It is generated from the same Zod schemas that validate live requests.",
        "",
        "**Environment (Hermes / cron):**",
        "- `KARRIQI_URL` — app origin, e.g. `https://karriqi.example.com`",
        "- `INGEST_TOKEN` — Bearer token (server `INGEST_TOKEN`)",
        "- `USER_ID` — Supabase user UUID placed in each request body as `userId`",
        "",
        `**Spec URLs:** \`GET ${OPENAPI_JSON_PATH}\` (JSON) or \`GET /openapi.yaml\` (YAML) on the same host as \`KARRIQI_URL\`.`,
        "",
        "Human-readable docs: `/developers`.",
      ].join("\n"),
    },
    servers: [{ url: "/", description: "Current deployment (Swagger UI uses page origin)" }],
    tags: [
      {
        name: "shopping-list",
        description: "Household shopping list rows",
      },
      {
        name: "kanban",
        description: "Todo board / kanban tasks",
      },
      {
        name: "calendar-events",
        description: "Calendar events",
      },
    ],
  });
}
