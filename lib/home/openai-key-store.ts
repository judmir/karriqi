import { createAdminClient } from "@/lib/supabase/admin";
import { decryptSecret } from "@/lib/home/secret-crypto";

/**
 * Server-only helpers for the stored OpenAI key. This module is intentionally
 * NOT a "use server" action file: `getDecryptedOpenAiKey` returns the raw key
 * and must never be callable from the browser. Import it only from other
 * server modules (server actions, route handlers).
 */

export function lastFour(key: string): string {
  const trimmed = key.trim();
  return trimmed.length <= 4 ? trimmed : trimmed.slice(-4);
}

/** Decrypted OpenAI key for a user, or null when none is stored. */
export async function getDecryptedOpenAiKey(
  userId: string,
): Promise<string | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data } = await admin
    .from("user_openai_keys")
    .select("encrypted_key")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data?.encrypted_key) return null;

  try {
    return decryptSecret(data.encrypted_key);
  } catch {
    return null;
  }
}
