# Notifications (scaffold)

- **In-app / realtime:** Subscribe with Supabase Realtime on a per-user or per-household channel; hydrate into React state or TanStack Query when you add client caches.
- **Web push:** Persist `PushSubscription` JSON per user; send from an Edge Function using VAPID; see `lib/push/README.md`.
- **This folder:** Keep transport-agnostic types and a small service facade so feature modules do not import Realtime or Workbox directly.
