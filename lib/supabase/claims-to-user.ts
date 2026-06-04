import type { JwtPayload, User } from "@supabase/supabase-js";

/**
 * Build a `User`-shaped object from verified JWT claims (`getClaims()`).
 *
 * The claims carry everything the app reads off the user (`id`, `email`,
 * `user_metadata`, `app_metadata`), so we avoid a separate `getUser()` network
 * call. Fields not present in the token (e.g. `created_at`) are filled with
 * safe defaults; the app does not rely on them.
 */
export function claimsToUser(claims: JwtPayload): User | null {
  if (!claims.sub) {
    return null;
  }

  return {
    id: claims.sub,
    aud: typeof claims.aud === "string" ? claims.aud : "authenticated",
    role: claims.role,
    email: claims.email,
    phone: claims.phone,
    app_metadata: claims.app_metadata ?? {},
    user_metadata: claims.user_metadata ?? {},
    created_at: "",
  } as User;
}
