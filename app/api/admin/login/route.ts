import crypto from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE_SECONDS, signAdminToken } from "@/lib/auth/admin-session";
import { clearRateLimit, consumeRateLimit, peekRateLimit, requestClientKey } from "@/lib/security/rate-limit";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

const loginSchema = z.object({ password: z.string().min(1) });

export async function POST(request: Request) {
  const key = `admin-login:${requestClientKey(request)}`;
  // Only FAILED attempts count (mục 6.2) — a correct login must not burn the
  // budget, or the owner gets locked out after 5 normal logins.
  const rate = peekRateLimit(key, MAX_ATTEMPTS);
  if (!rate.allowed) {
    return NextResponse.json({ error: "too_many_attempts" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  }

  const json = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(json);
  if (!parsed.success) {
    consumeRateLimit(key, MAX_ATTEMPTS, WINDOW_MS);
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const expected = process.env.ADMIN_PASSWORD ?? "";
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(parsed.data.password);

  // timingSafeEqual requires equal-length buffers, so the length check must
  // come first — this leaks only length, not content, and is the standard
  // Node idiom (see Node's own crypto.timingSafeEqual docs).
  const match =
    expected.length > 0 &&
    expectedBuf.length === providedBuf.length &&
    crypto.timingSafeEqual(expectedBuf, providedBuf);

  if (!match) {
    consumeRateLimit(key, MAX_ATTEMPTS, WINDOW_MS);
    // Deliberately generic — mục 6.2: "nếu sai: trả 401, KHÔNG nói 'sai mật khẩu' chi tiết".
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  clearRateLimit(key);
  const token = await signAdminToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
