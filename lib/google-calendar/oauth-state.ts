import { createHmac, randomBytes, timingSafeEqual } from "crypto";

import { GOOGLE_OAUTH_STATE_MAX_AGE_SEC } from "@/lib/google-calendar/constants";
import { getOAuthStateSecret } from "@/lib/env/google-calendar";

type StatePayload = {
  userId: string;
  nonce: string;
  issuedAt: number;
};

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createGoogleOAuthState(userId: string): string | null {
  const secret = getOAuthStateSecret();
  if (!secret) {
    return null;
  }

  const payload: StatePayload = {
    userId,
    nonce: randomBytes(16).toString("hex"),
    issuedAt: Date.now(),
  };

  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signPayload(body, secret);
  return `${body}.${signature}`;
}

export function verifyGoogleOAuthState(
  state: string,
  expectedUserId: string,
): boolean {
  const secret = getOAuthStateSecret();
  if (!secret) {
    return false;
  }

  const [body, signature] = state.split(".");
  if (!body || !signature) {
    return false;
  }

  const expectedSig = signPayload(body, secret);
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSig);
  if (
    sigBuf.length !== expectedBuf.length ||
    !timingSafeEqual(sigBuf, expectedBuf)
  ) {
    return false;
  }

  let payload: StatePayload;
  try {
    payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as StatePayload;
  } catch {
    return false;
  }

  if (payload.userId !== expectedUserId) {
    return false;
  }

  const ageMs = Date.now() - payload.issuedAt;
  return ageMs >= 0 && ageMs <= GOOGLE_OAUTH_STATE_MAX_AGE_SEC * 1000;
}
