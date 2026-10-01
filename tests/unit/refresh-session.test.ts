import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), create: vi.fn() }));
vi.mock("@supabase/ssr", () => ({ createServerClient: mocks.create }));
import { refreshCustomerSession } from "@/lib/supabase/refresh-session";
beforeEach(() => {
  vi.clearAllMocks();
});
it("does not call Auth for a public anonymous request", async () => {
  const apply = await refreshCustomerSession(new NextRequest("http://localhost/"));
  const response = apply(NextResponse.next());
  expect(mocks.create).not.toHaveBeenCalled();
  expect(response.cookies.getAll()).toEqual([]);
});
it("passes refreshed cookies both downstream and to the browser while preserving the rewrite", async () => {
  mocks.create.mockImplementation((_url, _key, options) => ({
    auth: {
      getUser: async () => {
        options.cookies.setAll([
          {
            name: "sb-test-auth-token",
            value: "new-test-token",
            options: { path: "/", httpOnly: true },
          },
        ]);
        return { data: { user: { id: "qa" } } };
      },
    },
  }));
  const request = new NextRequest("http://localhost/en/tai-khoan", {
    headers: { cookie: "sb-test-auth-token=old-test-token" },
  });
  const apply = await refreshCustomerSession(request);
  expect(request.cookies.get("sb-test-auth-token")?.value).toBe("new-test-token");
  const response = apply(
    NextResponse.rewrite(new URL("http://localhost/en/tai-khoan"), {
      request: { headers: request.headers },
    }),
  );
  expect(response.cookies.get("sb-test-auth-token")?.value).toBe("new-test-token");
  expect(response.headers.get("x-middleware-rewrite")).toContain("/en/tai-khoan");
  expect(response.headers.get("cache-control")).toBe("private, no-store");
});
