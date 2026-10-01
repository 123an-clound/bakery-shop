import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mock = vi.hoisted(() => ({
  user: null as null | { id: string },
  rows: [] as unknown[],
  filters: [] as string[][],
  admin: vi.fn(),
}));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: mock.user } }) } }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => {
    mock.admin();
    const chain = {
      select: () => chain,
      eq: (key: string, value: string) => {
        mock.filters.push([key, value]);
        return chain;
      },
      order: async () => ({ data: mock.rows, error: null }),
      maybeSingle: async () => ({ data: mock.rows[0] ?? null, error: null }),
    };
    return { from: () => chain };
  },
}));
import { getMyOrders, getOrderForReceipt } from "@/lib/bakery/orders";
beforeEach(() => {
  mock.user = null;
  mock.rows = [];
  mock.filters = [];
  vi.clearAllMocks();
});
it("guest history and forged receipts cannot read with service privileges", async () => {
  expect(await getMyOrders()).toEqual([]);
  expect(await getOrderForReceipt("BK260930-1234")).toBeNull();
  expect(mock.admin).not.toHaveBeenCalled();
});
it("binds history and receipt queries to the authenticated owner and strips internal fields", async () => {
  mock.user = { id: "owner-A" };
  mock.rows = [
    {
      id: 1,
      status: "pending",
      data: {
        code: "BK260930-1234",
        customer_name: "QA",
        phone: "0900000000",
        address: { line: "QA", city: "QA" },
        delivery_at: "2030-01-01T00:00:00Z",
        payment_method: "cod",
        subtotal: 100000,
        total: 100000,
        items_snapshot: [
          { product_id: 1, name: "QA", unit_price: 100000, qty: 1, line_total: 100000 },
        ],
        internal_note: "PRIVATE",
        request_hash: "PRIVATE",
        reserved_product_ids: [1],
      },
    },
  ];
  const orders = await getMyOrders();
  expect(mock.filters).toContainEqual(["data->>user_id", "owner-A"]);
  expect(orders[0]!.data).not.toHaveProperty("internal_note");
  expect(orders[0]!.data).not.toHaveProperty("request_hash");
  mock.filters = [];
  const receipt = await getOrderForReceipt("BK260930-1234");
  expect(mock.filters).toContainEqual(["data->>user_id", "owner-A"]);
  expect(mock.filters).toContainEqual(["data->>code", "BK260930-1234"]);
  expect(receipt!.data).not.toHaveProperty("internal_note");
});
