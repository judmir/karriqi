# Karriqi — internal documentation

Reference for how this repo is structured, why choices were made, and how to extend it. The root [README.md](../README.md) stays the quick start; **`doc/`** goes deeper.

| Document                                                           | Contents                                                      |
| ------------------------------------------------------------------ | ------------------------------------------------------------- |
| [architecture.md](./architecture.md)                               | Stack, request flow, folders, routing, design patterns        |
| [authentication-and-security.md](./authentication-and-security.md) | Supabase Auth, middleware, env secrets, household-only access |
| [development.md](./development.md)                                 | Scripts, ports, `karriqi.test`, TypeScript, lint/format       |
| [pwa.md](./pwa.md)                                                 | Manifest, service worker, build vs dev, generated files       |
| [notifications.md](./notifications.md)                             | Placeholder contracts; where Realtime / push will plug in     |
| [roadmap-and-scope.md](./roadmap-and-scope.md)                     | Phase 1 vs later; suggested Shopping module steps             |

**Convention:** file paths are from the repo root unless noted.
