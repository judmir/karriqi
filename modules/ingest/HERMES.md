# Hermes → Karriqi ingest

Copy this file (or link to it) into the **Hermes** agent project. Karriqi agents should point users here when wiring Hermes cron jobs or one-off pushes.

## Source of truth

**Never guess endpoints or JSON fields.** Always start from the deployed contract:

| URL | Format |
|-----|--------|
| `{KARRIQI_URL}/openapi.json` | JSON (preferred for agents) |
| `{KARRIQI_URL}/openapi.yaml` | YAML |
| `{KARRIQI_URL}/developers` | Human Swagger UI |

The spec is generated from the same Zod schemas that validate live `POST /api/ingest/*` requests. After Karriqi ships a new version, re-fetch `openapi.json` before pushing.

## Required environment

| Variable | Purpose |
|----------|---------|
| `KARRIQI_URL` | App origin, no trailing slash (e.g. `http://localhost:3010`) |
| `INGEST_TOKEN` | Server secret → header `Authorization: Bearer <token>` |
| `USER_ID` | Supabase auth user UUID → every request body field `userId` |

Karriqi must have `INGEST_TOKEN` set in `.env.local` (see `.env.example`).

## Workflow (every push)

1. **Fetch** `GET $KARRIQI_URL/openapi.json`.
2. **Choose** the path under `paths` for the resource (e.g. `POST /api/ingest/kanban`).
3. **Read** `requestBody` schema, `security` (bearer), and `responses` (400 validation, 401 auth).
4. **Build** JSON that matches the schema; include `"userId": "$USER_ID"`.
5. **POST** with `Content-Type: application/json` and `Authorization: Bearer $INGEST_TOKEN`.
6. **Idempotency** — when the schema includes optional `id`, reuse a stable UUID per external record (e.g. hash of listing URL) so cron reruns update instead of duplicate.
7. **Errors** — on `400`, read `error` and `details`; on `401`, fix token; on `501`, Karriqi has no `INGEST_TOKEN` configured.

If a resource is **not** listed in `openapi.json`, stop and report. Do not call undocumented URLs.

## Mapping findings to resources (today)

| You found… | Ingest path (see OpenAPI for exact body) |
|------------|------------------------------------------|
| Errands / groceries | `POST /api/ingest/shopping-list` |
| Tasks / listings / follow-ups | `POST /api/ingest/kanban` |
| Viewings / appointments | `POST /api/ingest/calendar-events` |
| Berlin Life / local intel feed | `POST /api/ingest/pulse-items` |
| Apartment domain (future) | `POST /api/ingest/apartment` when it appears in the spec |

Until `apartment` exists, use **kanban** (task per listing) and/or **calendar-events** (viewings).

## Example: morning apartment cron

**User prompt to Hermes:**

```text
Push new apartment findings into Karriqi.

1. GET $KARRIQI_URL/openapi.json and use only documented ingest paths.
2. For each new listing, POST /api/ingest/kanban with a stable id derived from the listing URL.
3. category: "Apartments"; put portal URL and notes in description.
4. Use env KARRIQI_URL, INGEST_TOKEN, USER_ID.
```

**Minimal curl (after reading schema from OpenAPI):**

```bash
curl -sS -X POST "$KARRIQI_URL/api/ingest/kanban" \
  -H "Authorization: Bearer $INGEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'"$USER_ID"'",
    "tasks": [{
      "id": "<stable-uuid-per-listing>",
      "title": "3Z Neubau Charlottenburg — 449k",
      "category": "Apartments",
      "description": "https://example.com/listing/123\nNotes from scan."
    }]
  }'
```

**Success response:**

```json
{
  "status": "ok",
  "results": [{ "id": "…", "action": "created" }]
}
```

## Example: shopping + calendar same run

1. Fetch `openapi.json`.
2. `POST /api/ingest/shopping-list` with `items: [{ "name": "…" }]`.
3. `POST /api/ingest/calendar-events` with `events: [{ "title", "startAt", "endAt" }]`.

Batch sizes and field limits are in the spec (array `min`/`max`).

## Karriqi maintainer checklist

When adding a new ingest resource in this repo, update OpenAPI (see `.cursor/rules/ingest-openapi-contract.mdc`) and add a row to the mapping table above.
