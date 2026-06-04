import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { cache } from "react";

import { isSupabaseConfigured } from "@/lib/env";
import { claimsToUser } from "@/lib/supabase/claims-to-user";
import type { Database } from "@/types/database";

export const createClient = cache(async function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components cannot set cookies; ignore when called from RSC.
          }
        },
      },
    },
  );
});

/**
 * Authenticated user for the current request.
 *
 * Uses `getClaims()` instead of `getUser()`: with asymmetric JWT signing keys
 * it verifies the token locally (WebCrypto, no network round-trip), falling
 * back to a server call only for legacy symmetric secrets. Either way the
 * token is cryptographically/server verified, so the result is safe to trust.
 */
export const getSessionUser = cache(async function getSessionUser(): Promise<
  User | null
> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    return null;
  }

  return claimsToUser(data.claims);
});
