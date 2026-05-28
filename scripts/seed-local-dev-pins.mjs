#!/usr/bin/env node
/**
 * Seeds numeric PINs for local Supabase dev users after `supabase db reset`.
 * Uses the same HMAC + scrypt format as lib/auth/pin-hash.ts (keep in sync).
 */
import { createHmac, randomBytes, scrypt as scryptCb } from "node:crypto";
import { readFileSync } from "node:fs";
import { promisify } from "node:util";
import { createClient } from "@supabase/supabase-js";

const scrypt = promisify(scryptCb);
const SCRYPT_KEYLEN = 32;
const SCRYPT_SALT_BYTES = 16;

/** Keep in sync with lib/auth/dev-test-users.ts */
const LOCAL_DEV_PIN_PEPPER =
  "karriqi-local-dev-pin-pepper-v1-not-for-production";

const DEV_USERS = [
  {
    userId: "e18a4b29-ed05-4140-99af-9f6a8c906074",
    email: "judikarriqi@gmail.com",
    pin: "123456",
  },
  {
    userId: "fbf3f6b3-2aff-4a72-9c1d-22cda9cdf398",
    email: "savinakarriqi@gmail.com",
    pin: "654321",
  },
];

function loadEnvLocal(root) {
  const path = `${root}/.env.local`;
  let content;
  try {
    content = readFileSync(path, "utf8");
  } catch {
    throw new Error(`Missing ${path} — run pnpm worktree:dev first.`);
  }
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

function getPepper() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const isLocal =
    url.includes("127.0.0.1") || url.includes("localhost");

  if (isLocal) {
    return LOCAL_DEV_PIN_PEPPER;
  }

  const pepper = process.env.AUTH_PIN_PEPPER?.trim();
  if (!pepper || pepper.length < 16) {
    throw new Error("AUTH_PIN_PEPPER must be set (>= 16 chars) in .env.local.");
  }
  return pepper;
}

function computePinLookupHash(pin) {
  return createHmac("sha256", getPepper()).update(pin).digest("hex");
}

async function hashPin(pin) {
  const salt = randomBytes(SCRYPT_SALT_BYTES);
  const derived = await scrypt(pin, salt, SCRYPT_KEYLEN);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

async function main() {
  const root = new URL("..", import.meta.url).pathname;
  loadEnvLocal(root);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url?.includes("127.0.0.1") && !url?.includes("localhost")) {
    console.log("Skipping dev PIN seed — NEXT_PUBLIC_SUPABASE_URL is not local.");
    return;
  }
  if (!url || !serviceKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const { userId, pin, email } of DEV_USERS) {
    const pin_lookup_hash = computePinLookupHash(pin);
    const pin_hash = await hashPin(pin);
    const { error } = await admin.from("user_pins").upsert(
      {
        user_id: userId,
        pin_lookup_hash,
        pin_hash,
        failed_count: 0,
        lockout_until: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(`${email}: ${error.message}`);
  }

  console.log("Dev PIN sign-in:");
  for (const { email, pin } of DEV_USERS) {
    console.log(`  ${email}  PIN ${pin}`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
