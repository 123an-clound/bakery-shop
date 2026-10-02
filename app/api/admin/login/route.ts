import crypto from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  signAdminToken,
} from "@/lib/auth/admin-session";
import {
  clearRateLimit,
  consumeRateLimit,
  requestClientKey,
} from "@/lib/security/rate-limit";
import { readLimitedBody } from "@/lib/security/request-body";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

const loginSchema = z.object({ password: z.string().min(1).max(1024) });

export async function POST(request: Request) {
  const key = `admin-login:${requestClientKey(request)}`;
  // Reserve before reading the body: concurrent guesses must not all pass a
  // separate peek. A successful password check clears its failure budget.
  const rate = await consumeRateLimit(key, MAX_ATTEMPTS, WINDOW_MS);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "too_many_attempts" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  let json: unknown;
  try {
    json = JSON.parse(new TextDecoder().decode(await readLimitedBody(request, 4096)));
  } catch {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 400 });
  }
  const parsed = loginSchema.safeParse(json);
  if (!parsed.success) {
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
    // Deliberately generic — mục 6.2: "nếu sai: trả 401, KHÔNG nói 'sai mật khẩu' chi tiết".
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  await clearRateLimit(key);
  let token: string;
  try {
    token = await signAdminToken();
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 503 });
  }
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
