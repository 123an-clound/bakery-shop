import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { signAdminToken, verifyAdminToken } from "@/lib/auth/admin-session";

beforeEach(() => {
  vi.stubEnv("ADMIN_SESSION_SECRET", "test-only-session-key-with-32-characters");
  vi.stubEnv("ADMIN_PASSWORD", "test-only-password");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("admin sessions", () => {
  it("accepts an authentic session and rejects tampering and extra segments", async () => {
    const token = await signAdminToken();
    expect(await verifyAdminToken(token)).toBe(true);
    expect(await verifyAdminToken(token + ".extra")).toBe(false);
    expect(await verifyAdminToken("bad." + token)).toBe(false);
    expect(await verifyAdminToken("x".repeat(1025))).toBe(false);
  });
  it("revokes sessions after password rotation", async () => {
    const token = await signAdminToken();
    vi.stubEnv("ADMIN_PASSWORD", "rotated-test-only-password");
    expect(await verifyAdminToken(token)).toBe(false);
    expect(await verifyAdminToken(await signAdminToken())).toBe(true);
  });
  it("expires after eight hours and fails closed for a short signing secret", async () => {
    vi.useFakeTimers();
    const token = await signAdminToken();
    vi.advanceTimersByTime(8 * 60 * 60 * 1000);
    expect(await verifyAdminToken(token)).toBe(false);
    vi.stubEnv("ADMIN_SESSION_SECRET", "short");
    await expect(signAdminToken()).rejects.toThrow();
    expect(await verifyAdminToken(token)).toBe(false);
  });
});
