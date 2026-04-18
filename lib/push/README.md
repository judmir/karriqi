# Web push (deferred)

Planned pieces (not implemented in phase 1):

1. **Client:** `serviceWorkerRegistration.pushManager.subscribe` with `applicationServerKey` (VAPID public key).
2. **Server:** Supabase Edge Function (or similar) to send Web Push messages using the private VAPID key.
3. **Storage:** Table mapping `user_id` → subscription JSON, updated when the user subscribes or rotates keys.
4. **Service worker:** Extend the PWA worker to handle `push` and `notificationclick` — `@ducanh2912/next-pwa` supports custom worker composition when you need it.

Keep push logic out of feature modules; call a thin `lib/push/subscribe.ts` (future) from settings or a dedicated prompt.
