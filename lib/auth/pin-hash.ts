import {
  createHmac,
  randomBytes,
  scrypt as scryptCb,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

// Slow hash for verification. Small key space (4-8 digit PINs) means
// per-user/per-IP lockouts do the heavy lifting; scrypt still makes a leaked
// DB row much harder to crack offline than a plain HMAC or unsalted SHA.
import { isLocalSupabaseUrl } from "@/lib/auth/local-dev-auth";
import { LOCAL_DEV_PIN_PEPPER } from "@/lib/auth/dev-test-users";

const scrypt = promisify(scryptCb) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
) => Promise<Buffer>;

const SCRYPT_KEYLEN = 32;
const SCRYPT_SALT_BYTES = 16;

export const PIN_MIN_LENGTH = 4;
export const PIN_MAX_LENGTH = 8;

/** True iff `pin` is a digits-only string of the allowed length range. */
export function isValidPin(pin: string): boolean {
  return /^[0-9]+$/.test(pin) && pin.length >= PIN_MIN_LENGTH && pin.length <= PIN_MAX_LENGTH;
}

function getPepper(): string {
  if (isLocalSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)) {
    return LOCAL_DEV_PIN_PEPPER;
  }

  const pepper = process.env.AUTH_PIN_PEPPER?.trim();
  if (!pepper || pepper.length < 16) {
    throw new Error(
      "AUTH_PIN_PEPPER must be set to a server-only random string of at least 16 characters.",
    );
  }
  return pepper;
}

/**
 * Deterministic HMAC of the PIN, used to look up the user that owns it without
 * scanning every row. A DB leak alone cannot reveal the PIN — only an attacker
 * who also has `AUTH_PIN_PEPPER` could brute-force the small key space.
 */
export function computePinLookupHash(pin: string): string {
  return createHmac("sha256", getPepper()).update(pin).digest("hex");
}

/** scrypt-derived hash stored alongside the lookup hash. Format: `<saltHex>:<derivedHex>`. */
export async function hashPin(pin: string): Promise<string> {
  const salt = randomBytes(SCRYPT_SALT_BYTES);
  const derived = await scrypt(pin, salt, SCRYPT_KEYLEN);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

/** Verify a PIN against a stored hash. Returns false on any parse/length issue. */
export async function verifyPin(pin: string, stored: string): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 2) return false;
  const [saltHex, derivedHex] = parts;
  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(saltHex, "hex");
    expected = Buffer.from(derivedHex, "hex");
  } catch {
    return false;
  }
  if (expected.length !== SCRYPT_KEYLEN) return false;
  const derived = await scrypt(pin, salt, SCRYPT_KEYLEN);
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}
