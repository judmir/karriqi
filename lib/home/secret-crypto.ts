import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

/**
 * AES-256-GCM encryption for at-rest secrets (the per-user OpenAI API key).
 * The 32-byte master key comes from the server-only `HOME_SECRETS_ENCRYPTION_KEY`
 * env var (64 hex chars). Ciphertext format is `<ivHex>:<tagHex>:<dataHex>`.
 */

const IV_BYTES = 12;
const KEY_BYTES = 32;

function getMasterKey(): Buffer {
  const raw = process.env.HOME_SECRETS_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new Error(
      "HOME_SECRETS_ENCRYPTION_KEY is not set. Generate one with: openssl rand -hex 32",
    );
  }
  let key: Buffer;
  try {
    key = Buffer.from(raw, "hex");
  } catch {
    throw new Error("HOME_SECRETS_ENCRYPTION_KEY must be hex.");
  }
  if (key.length !== KEY_BYTES) {
    throw new Error(
      "HOME_SECRETS_ENCRYPTION_KEY must be 32 bytes (64 hex chars).",
    );
  }
  return key;
}

/** True when a valid master key is configured (used for graceful UI messaging). */
export function isHomeSecretsConfigured(): boolean {
  try {
    getMasterKey();
    return true;
  } catch {
    return false;
  }
}

export function encryptSecret(plaintext: string): string {
  const key = getMasterKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptSecret(payload: string): string {
  const key = getMasterKey();
  const parts = payload.split(":");
  if (parts.length !== 3) {
    throw new Error("Malformed encrypted secret.");
  }
  const [ivHex, tagHex, dataHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const data = Buffer.from(dataHex, "hex");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString("utf8");
}
