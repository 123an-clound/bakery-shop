import crypto from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE_SECONDS, signAdminToken } from "@/lib/auth/admin-session";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

/**
 * In-memory rate limit — acceptable for local/single-instance use (mục 6.2
 * explicitly allows this for local dev; a real deploy behind multiple
 * instances would need a shared store instead).
 */
const attempts = new Map<string, { count: number; windowStart: number }>();

function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return "unknown";
}

function isRateLimited(ip: string): boolean {
  const entry = attempts.get(ip);
  if (!entry || Date.now() - entry.windowStart > WINDOW_MS) return false;
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    attempts.set(ip, { count: 1, windowStart: now });
    return;
  }
  entry.count += 1;
}

const loginSchema = z.object({ password: z.string().min(1) });

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "too_many_attempts" }, { status: 429 });
  }

  const json = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(json);
  if (!parsed.success) {
    recordFailedAttempt(ip);
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
    recordFailedAttempt(ip);
    // Deliberately generic — mục 6.2: "nếu sai: trả 401, KHÔNG nói 'sai mật khẩu' chi tiết".
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  attempts.delete(ip);
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
