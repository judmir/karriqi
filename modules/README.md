# Feature modules

Vertical slices and shared domain logic live here. UI entry components are mounted from `app/(main)/<route>/`.

| Module | Path | Role |
| --- | --- | --- |
| **Ingest** | `modules/ingest/` | Zod schemas, OpenAPI registry, route manifest for `/api/ingest/*` |
| **Operator** | `modules/operator/` | Payload schemas for agent-written content (e.g. weekend planner) |

Feature UI for shopping, kanban, and calendar currently lives in `components/` and `lib/repositories/`; new vertical slices can move here as the codebase grows.

See [`doc/project-context.md`](../doc/project-context.md) for the product map.
