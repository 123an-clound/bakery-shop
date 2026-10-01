import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

const MAX_AGE = 24 * 60 * 60;
export const ORDER_ACCESS_MAX_AGE = MAX_AGE;
export const orderAccessCookie = (code: string) => `bk_order_${code}`;

function signature(payload: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("Order access signing key is not configured");
  return createHmac("sha256", secret).update(`order-receipt:${payload}`).digest("base64url");
}

export function signOrderAccess(code: string): string {
  const payload = Buffer.from(JSON.stringify({ code, exp: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export function verifyOrderAccess(code: string, token: string | undefined): boolean {
  if (!token || token.length > 1024) return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return false;
    const [payload, mac] = parts as [string, string];
    const actual = Buffer.from(mac, "base64url");
    const expected = Buffer.from(signature(payload), "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return data.code === code && Number.isFinite(data.exp) && data.exp > Date.now();
  } catch {
    return false;
  }
}
