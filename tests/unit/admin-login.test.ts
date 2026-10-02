import { afterEach, beforeEach, expect, it, vi } from "vitest";
const sharedCounters = vi.hoisted(() => new Map<string, number>());
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    rpc: async (name: string, args: { p_bucket_hash: string; p_limit?: number }) => {
      if (name === "clear_rate_limit") {
        sharedCounters.delete(args.p_bucket_hash);
        return { data: null, error: null };
      }
      const count = (sharedCounters.get(args.p_bucket_hash) ?? 0) + 1;
      sharedCounters.set(args.p_bucket_hash, count);
      return { data: { allowed: count <= (args.p_limit ?? 0), retry_after_seconds: 900 }, error: null };
    },
  }),
}));
import { POST } from "@/app/api/admin/login/route";
import { clearRateLimit } from "@/lib/security/rate-limit";
const client = "qa-concurrent-login";
const request = (password: string) => new Request("http://localhost/api/admin/login", {
  method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": client },
  body: JSON.stringify({ password }),
});
beforeEach(async () => {
  sharedCounters.clear();
  vi.stubEnv("ADMIN_PASSWORD", "test-only-password");
  vi.stubEnv("ADMIN_SESSION_SECRET", "test-only-session-key-with-32-characters");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key-for-unit-tests");
  await clearRateLimit(`admin-login:${client}`);
});
afterEach(() => { vi.unstubAllEnvs(); });
it("limits simultaneous guesses before asynchronous body parsing", async () => {
  const responses = await Promise.all(Array.from({ length: 12 }, () => POST(request("wrong"))));
  expect(responses.filter(r => r.status === 401)).toHaveLength(5);
  expect(responses.filter(r => r.status === 429)).toHaveLength(7);
  expect(responses.find(r => r.status === 429)?.headers.get("retry-after")).toBeTruthy();
});
it("successful logins reset the attempt budget", async () => {
  for (let i = 0; i < 8; i++) {
    const response = await POST(request("test-only-password"));
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("SameSite=strict");
  }
});
it("rejects oversized login bodies", async () => {
  expect((await POST(request("x".repeat(5000)))).status).toBe(400);
});
