import "server-only";

/**
 * Signs and verifies the admin session token (`bk_admin` cookie) — mục 6.2.
 *
 * Uses Web Crypto (`crypto.subtle`) rather than Node's `crypto` module so the
 * exact same code runs in both the Edge-runtime proxy (`proxy.ts`, which
 * cannot use Node's `crypto`) and Node route handlers/Server Actions.
 * `crypto.subtle.verify` compares the HMAC digest in constant time, so no
 * separate timing-safe-equal step is needed here (unlike the password check
 * in `/api/admin/login`, which does need `crypto.timingSafeEqual` — see that
 * route for why).
 */

export const ADMIN_SESSION_COOKIE = "bk_admin";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;
const SESSION_DURATION_MS = ADMIN_SESSION_MAX_AGE_SECONDS * 1000;

interface AdminTokenPayload {
  exp: number;
}

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not set");
  return secret;
}

async function getHmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function toBase64Url(bytes: ArrayBuffer): string {
  const arr = new Uint8Array(bytes);
  let binary = "";
  for (const byte of arr) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(input: string): Uint8Array<ArrayBuffer> {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(input.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function signAdminToken(): Promise<string> {
  const payload: AdminTokenPayload = { exp: Date.now() + SESSION_DURATION_MS };
  const payloadB64 = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)).buffer as ArrayBuffer);
  const key = await getHmacKey();
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  return `${payloadB64}.${toBase64Url(signature)}`;
}

export async function verifyAdminToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return false;

  try {
    const key = await getHmacKey();
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64Url(sigB64),
      new TextEncoder().encode(payloadB64),
    );
    if (!valid) return false;

    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadB64))) as AdminTokenPayload;
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}
