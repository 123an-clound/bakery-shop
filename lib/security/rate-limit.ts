import "server-only";

import { createHmac } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";

type RateLimitResult = { allowed: boolean; retryAfterSeconds: number; shared: boolean };
type LocalEntry = { count: number; resetAt: number };
const localBuckets = new Map<string, LocalEntry>();
let nextCleanup = 0;
let sharedStoreUnavailableUntil = 0;
let sharedStoreWarningLogged = false;

function consumeLocally(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  if (now >= nextCleanup) {
    for (const [bucketKey, entry] of localBuckets) if (entry.resetAt <= now) localBuckets.delete(bucketKey);
    nextCleanup = now + 60_000;
  }
  if (localBuckets.size >= 10_000 && !localBuckets.has(key)) {
    return { allowed: false, retryAfterSeconds: 60, shared: false };
  }
  const current = localBuckets.get(key);
  if (!current || current.resetAt <= now) {
    localBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: Math.ceil(windowMs / 1000), shared: false };
  }
  if (current.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)), shared: false };
  }
  current.count += 1;
  return { allowed: true, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)), shared: false };
}

function warnSharedStoreUnavailable() {
  if (!sharedStoreWarningLogged) {
    console.error("[rate-limit] shared_store_unavailable_using_process_fallback");
    sharedStoreWarningLogged = true;
  }
}

function localFallback(key: string, limit: number, windowMs: number): RateLimitResult {
  warnSharedStoreUnavailable();
  return consumeLocally(key, limit, windowMs);
}

function hashRateKey(key: string): string | null {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) return null;
  return createHmac("sha256", secret).update(key).digest("hex");
}

export async function consumeRateLimit(key: string, limit: number, windowMs: number): Promise<{
  allowed: boolean;
  retryAfterSeconds: number;
  shared: boolean;
}> {
  const bucketHash = hashRateKey(key);
  if (!bucketHash || !Number.isSafeInteger(limit) || limit < 1 || !Number.isSafeInteger(windowMs) || windowMs < 1) {
    return consumeLocally(key, limit, windowMs);
  }
  if (Date.now() < sharedStoreUnavailableUntil) return consumeLocally(key, limit, windowMs);

  try {
    const { data, error } = await createAdminClient().rpc("consume_rate_limit", {
      p_bucket_hash: bucketHash,
      p_limit: limit,
      p_window_seconds: Math.max(1, Math.ceil(windowMs / 1000)),
    });
    if (error || !data || typeof data !== "object" || Array.isArray(data)) throw new Error("shared_store_unavailable");
    const result = data as { allowed?: unknown; retry_after_seconds?: unknown };
    if (typeof result.allowed !== "boolean" || typeof result.retry_after_seconds !== "number") throw new Error("invalid_shared_rate_limit_response");
    sharedStoreUnavailableUntil = 0;
    sharedStoreWarningLogged = false;
    return { allowed: result.allowed, retryAfterSeconds: Math.max(1, Math.ceil(result.retry_after_seconds)), shared: true };
  } catch {
    sharedStoreUnavailableUntil = Date.now() + 60_000;
    return localFallback(key, limit, windowMs);
  }
}

export async function clearRateLimit(key: string): Promise<void> {
  localBuckets.delete(key);
  const bucketHash = hashRateKey(key);
  if (!bucketHash || Date.now() < sharedStoreUnavailableUntil) return;
  try {
    const { error } = await createAdminClient().rpc("clear_rate_limit", { p_bucket_hash: bucketHash });
    if (error) {
      sharedStoreUnavailableUntil = Date.now() + 60_000;
      warnSharedStoreUnavailable();
    }
  } catch {
    sharedStoreUnavailableUntil = Date.now() + 60_000;
    warnSharedStoreUnavailable();
  }
}

export function requestClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const real = request.headers.get("x-real-ip");
  // On trusted reverse proxies, the right-most forwarded value is the client
  // address. Never use the entire attacker-controlled header as a bucket key.
  const ip = forwarded?.split(",").at(-1)?.trim() || real?.trim() || "unknown";
  return ip.slice(0, 128);
}
