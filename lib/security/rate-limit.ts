type Entry = { count: number; resetAt: number };

const buckets = new Map<string, Entry>();

export function consumeRateLimit(key: string, limit: number, windowMs: number): {
  allowed: boolean;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: Math.ceil(windowMs / 1000) };
  }
  if (current.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }
  current.count += 1;
  return { allowed: true, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) };
}

/** Checks a bucket without consuming from it (for "count only failures" flows). */
export function peekRateLimit(key: string, limit: number): { allowed: boolean; retryAfterSeconds: number } {
  const current = buckets.get(key);
  const now = Date.now();
  if (!current || current.resetAt <= now || current.count < limit) return { allowed: true, retryAfterSeconds: 0 };
  return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
}

export function clearRateLimit(key: string): void {
  buckets.delete(key);
}

export function requestClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const real = request.headers.get("x-real-ip");
  // On trusted reverse proxies, the right-most forwarded value is the client
  // address. Never use the entire attacker-controlled header as a bucket key.
  const ip = forwarded?.split(",").at(-1)?.trim() || real?.trim() || "unknown";
  return ip.slice(0, 128);
}
