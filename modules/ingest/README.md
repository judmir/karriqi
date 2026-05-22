# Ingest API (Hermes & third parties)

| URL | Purpose |
|-----|---------|
| `GET /openapi.json` | Machine-readable contract (JSON) |
| `GET /openapi.yaml` | Same contract as YAML |
| `GET /developers` | Swagger UI (Petstore-style explorer) |
| `POST /api/ingest/shopping-list` | Upsert shopping list rows |
| `POST /api/ingest/kanban` | Create/update kanban tasks |
| `POST /api/ingest/calendar-events` | Create/update calendar events |

**Hermes environment:** `KARRIQI_URL`, `INGEST_TOKEN`, `USER_ID` (JSON `userId`).

| Doc | Audience |
|-----|----------|
| **[HERMES.md](./HERMES.md)** | Hermes / cron agents — how to consume `openapi.json` and push data |
| `.cursor/rules/hermes-karriqi-ingest-consumer.mdc` | Cursor — drafting Hermes prompts & consumer behavior |
| `.cursor/rules/ingest-openapi-contract.mdc` | Cursor — adding/changing ingest endpoints in Karriqi |
