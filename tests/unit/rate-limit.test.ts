import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  count: 0,
  fail: false,
  lastArgs: undefined as Record<string, unknown> | undefined,
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    rpc: async (name: string, args: Record<string, unknown>) => {
      state.lastArgs = args;
      if (state.fail) return { data: null, error: new Error("unavailable") };
      if (name === "clear_rate_limit") {
        state.count = 0;
        return { data: null, error: null };
      }
      state.count += 1;
      return {
        data: { allowed: state.count <= Number(args.p_limit), retry_after_seconds: 30 },
        error: null,
      };
    },
  }),
}));

import { clearRateLimit, consumeRateLimit, requestClientKey } from "@/lib/security/rate-limit";

describe("shared rate limit", () => {
  beforeEach(() => {
    state.count = 0;
    state.fail = false;
    state.lastArgs = undefined;
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-only-service-role-secret");
  });

  afterEach(() => vi.unstubAllEnvs());

  it("uses a hashed key and enforces the shared counter response", async () => {
    const first = await consumeRateLimit("login:203.0.113.9", 2, 60_000);
    const second = await consumeRateLimit("login:203.0.113.9", 2, 60_000);
    const third = await consumeRateLimit("login:203.0.113.9", 2, 60_000);

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third).toEqual({ allowed: false, retryAfterSeconds: 30, shared: true });
    expect(state.lastArgs?.p_bucket_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(state.lastArgs?.p_bucket_hash).not.toContain("203.0.113.9");
  });

  it("clears a shared counter after a successful login", async () => {
    await consumeRateLimit("login:203.0.113.9", 1, 60_000);
    await clearRateLimit("login:203.0.113.9");
    expect((await consumeRateLimit("login:203.0.113.9", 1, 60_000)).allowed).toBe(true);
  });

  it("preserves the prior local limit when the shared store is not configured or available", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect(await consumeRateLimit("upload:unknown", 1, 60_000)).toMatchObject({ allowed: true, shared: false });
    expect(await consumeRateLimit("upload:unknown", 1, 60_000)).toMatchObject({ allowed: false, shared: false });

    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-only-service-role-secret");
    state.fail = true;
    expect(await consumeRateLimit("upload:unavailable", 1, 60_000)).toMatchObject({ allowed: true, shared: false });
    expect(await consumeRateLimit("upload:unavailable", 1, 60_000)).toMatchObject({ allowed: false, shared: false });
  });

  it("extracts the client key without retaining attacker-controlled forwarded chains", () => {
    const request = new Request("https://example.test", {
      headers: { "x-forwarded-for": "198.51.100.1, 203.0.113.7", "x-real-ip": "192.0.2.1" },
    });
    expect(requestClientKey(request)).toBe("203.0.113.7");
  });
});
