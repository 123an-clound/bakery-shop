import type { User } from "@supabase/supabase-js";
import { beforeEach, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mock = vi.hoisted(() => ({ find: vi.fn(), create: vi.fn(), filters: [] as unknown[][] }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => {
    const query = {
      select: () => query,
      eq: (key: string, value: string) => { mock.filters.push([key, value]); return query; },
      limit: () => query,
      maybeSingle: mock.find,
    };
    return { from: () => query };
  },
}));
vi.mock("@/lib/bakery/mutations", () => ({ createBakeryRow: mock.create }));
import { ensureCustomerProfile } from "@/lib/bakery/customer-profile";

const user: User = {
  id: "verified-user",
  user_metadata: { full_name: "Customer" },
  app_metadata: {},
  aud: "authenticated",
  created_at: "2026-10-06T00:00:00Z",
};
beforeEach(() => {
  vi.clearAllMocks();
  mock.filters = [];
  mock.find.mockResolvedValue({ data: null, error: null });
  mock.create.mockResolvedValue({ id: 1 });
});

it("binds the profile to the verified Auth identity", async () => {
  await ensureCustomerProfile(user);
  expect(mock.filters).toContainEqual(["type", "customer"]);
  expect(mock.filters).toContainEqual(["data->>user_id", "verified-user"]);
  expect(mock.create).toHaveBeenCalledWith({
    type: "customer", data: { user_id: "verified-user", full_name: "Customer" },
  });
});
it("keeps an existing profile instead of creating a duplicate", async () => {
  mock.find.mockResolvedValue({ data: { id: 1 }, error: null });
  await ensureCustomerProfile(user);
  expect(mock.create).not.toHaveBeenCalled();
});
it("preserves a successful login when profile storage is unavailable and logs no private details", async () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  mock.find.mockResolvedValue({ data: null, error: new Error("private details") });
  await expect(ensureCustomerProfile(user)).resolves.toBeUndefined();
  expect(mock.create).not.toHaveBeenCalled();
  expect(log).toHaveBeenCalledWith("[auth] customer_profile_failed");
  log.mockRestore();
});
