import { describe, expect, it } from "vitest";

import { clearRateLimit, consumeRateLimit, peekRateLimit } from "@/lib/security/rate-limit";

describe("rate limit (failed-attempt counting)", () => {
  it("blocks after `limit` failures, peeking never consumes, and clear resets", () => {
    const key = `test:${Math.random()}`;
    for (let i = 0; i < 10; i++) expect(peekRateLimit(key, 5).allowed).toBe(true);

    for (let i = 0; i < 5; i++) consumeRateLimit(key, 5, 60_000);
    expect(peekRateLimit(key, 5).allowed).toBe(false);

    clearRateLimit(key);
    expect(peekRateLimit(key, 5).allowed).toBe(true);
  });
});
