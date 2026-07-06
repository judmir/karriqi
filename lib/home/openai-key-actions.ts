"use server";

import { encryptSecret, isHomeSecretsConfigured } from "@/lib/home/secret-crypto";
import { lastFour } from "@/lib/home/openai-key-store";
import { testOpenAiKey } from "@/lib/home/openai-client";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/supabase/server";

export type OpenAiKeyStatus = {
  hasKey: boolean;
  configured: boolean;
  hint: string | null;
};

export type OpenAiKeyActionResult =
  | { ok: true }
  | { ok: false; message: string };

/** Status for the settings page: never returns the key itself. */
export async function getOwnOpenAiKeyStatus(): Promise<OpenAiKeyStatus> {
  const configured = isHomeSecretsConfigured();
  const user = await getSessionUser();
  if (!user) return { hasKey: false, configured, hint: null };

  const admin = createAdminClient();
  if (!admin) return { hasKey: false, configured: false, hint: null };

  const { data } = await admin
    .from("user_openai_keys")
    .select("key_hint")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    hasKey: !!data,
    configured,
    hint: data?.key_hint ?? null,
  };
}

/** Validate, encrypt, and store the caller's OpenAI key. */
export async function setOwnOpenAiKey(
  rawKey: string,
): Promise<OpenAiKeyActionResult> {
  if (!isHomeSecretsConfigured()) {
    return {
      ok: false,
      message:
        "Server encryption key is not configured (set HOME_SECRETS_ENCRYPTION_KEY).",
    };
  }

  const key = rawKey.trim();
  if (!key.startsWith("sk-") || key.length < 20) {
    return { ok: false, message: "That does not look like an OpenAI API key." };
  }

  const user = await getSessionUser();
  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false,
      message: "Server admin client not available (set SUPABASE_SERVICE_ROLE_KEY).",
    };
  }

  const test = await testOpenAiKey(key);
  if (!test.ok) {
    return { ok: false, message: test.message };
  }

  const now = new Date().toISOString();
  const { error } = await admin.from("user_openai_keys").upsert(
    {
      user_id: user.id,
      encrypted_key: encryptSecret(key),
      key_hint: lastFour(key),
      updated_at: now,
    },
    { onConflict: "user_id" },
  );
  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}

export async function removeOwnOpenAiKey(): Promise<OpenAiKeyActionResult> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false,
      message: "Server admin client not available (set SUPABASE_SERVICE_ROLE_KEY).",
    };
  }

  const { error } = await admin
    .from("user_openai_keys")
    .delete()
    .eq("user_id", user.id);
  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
}
