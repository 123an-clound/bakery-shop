import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signUp: vi.fn(),
  exchange: vi.fn(),
  profile: vi.fn(),
  redirect: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { signUp: mocks.signUp, exchangeCodeForSession: mocks.exchange },
  }),
}));
vi.mock("@/lib/bakery/customer-profile", () => ({ ensureCustomerProfile: mocks.profile }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import { signUp } from "@/lib/actions/auth";
import { GET } from "@/app/api/auth/callback/route";

const user = { id: "verified-user", user_metadata: { full_name: "Test Customer" } };
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://bakery-shop-gray.vercel.app");
  mocks.profile.mockResolvedValue(undefined);
  mocks.signUp.mockResolvedValue({ data: { user, session: null }, error: null });
  mocks.exchange.mockResolvedValue({ data: { user }, error: null });
});

describe("bakery customer confirmation", () => {
  it("sends confirmation back to the bakery callback and waits for email verification", async () => {
    const form = new FormData();
    form.set("email", "customer@example.com");
    form.set("password", "test-password");
    form.set("fullName", "Test Customer");
    expect(await signUp({ status: "idle" }, form)).toEqual({ status: "confirm_email" });
    expect(mocks.signUp).toHaveBeenCalledWith({
      email: "customer@example.com",
      password: "test-password",
      options: {
        data: { full_name: "Test Customer" },
        emailRedirectTo: "https://bakery-shop-gray.vercel.app/api/auth/callback",
      },
    });
    expect(mocks.profile).not.toHaveBeenCalled();
  });

  it("exchanges a valid code, creates the verified user's profile and ignores external next URLs", async () => {
    const response = await GET(new Request(
      "https://untrusted-host.example/api/auth/callback?code=valid-code&sb_flow_id=flow-1&next=https://evil.example",
    ));
    expect(mocks.exchange).toHaveBeenCalledWith("valid-code", { flowId: "flow-1" });
    expect(mocks.profile).toHaveBeenCalledWith(user);
    expect(response.headers.get("location")).toBe("https://bakery-shop-gray.vercel.app/tai-khoan");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("preserves immediate signup when email confirmation is disabled", async () => {
    mocks.signUp.mockResolvedValue({ data: { user, session: {} }, error: null });
    const form = new FormData();
    form.set("email", "customer@example.com");
    form.set("password", "test-password");
    form.set("fullName", "Test Customer");
    await signUp({ status: "idle" }, form);
    expect(mocks.profile).toHaveBeenCalledWith(user);
    expect(mocks.redirect).toHaveBeenCalledWith("/tai-khoan");
  });

  it("does not create a profile when the code has expired or was rejected", async () => {
    mocks.exchange.mockResolvedValue({ data: { user: null }, error: { message: "expired" } });
    const response = await GET(new Request("https://bakery-shop-gray.vercel.app/api/auth/callback?code=expired"));
    expect(response.headers.get("location")).toBe("https://bakery-shop-gray.vercel.app/tai-khoan/dang-nhap");
    expect(mocks.profile).not.toHaveBeenCalled();
  });

  it.each(["", `?code=${"a".repeat(2049)}`, `?code=valid&sb_flow_id=${"a".repeat(2049)}`])(
    "rejects a missing or oversized code without calling Auth (%s)", async (query) => {
      const response = await GET(new Request(`https://bakery-shop-gray.vercel.app/api/auth/callback${query}`));
      expect(response.headers.get("location")).toBe("https://bakery-shop-gray.vercel.app/tai-khoan/dang-nhap");
      expect(mocks.exchange).not.toHaveBeenCalled();
    },
  );
});
