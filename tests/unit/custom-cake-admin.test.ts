import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mock = vi.hoisted(() => ({
  admin: vi.fn(),
  rpc: vi.fn(),
  send: vi.fn(),
  cake: null as unknown,
}));
vi.mock("@/lib/auth/require-admin", () => ({ requireAdmin: mock.admin }));
vi.mock("@/lib/bakery/admin/custom-cake", () => ({ getAdminCustomCake: async () => mock.cake }));
vi.mock("@/lib/bakery/queries", () => ({
  getSiteSettings: async () => ({ data: { brand_name: { vi: "QA" } } }),
}));
vi.mock("@/lib/email/client", () => ({ sendEmail: mock.send }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    rpc: mock.rpc,
    from: () => {
      let type = "";
      const chain = {
        select: () => chain,
        eq: (key: string, value: string) => {
          if (key === "type") type = value;
          return chain;
        },
        maybeSingle: async () => ({
          error: null,
          data:
            type === "custom_cake"
              ? mock.cake
              : { data: { brand_name: { vi: "QA" }, shipping: { fee: 25000, free_from: 500000 } } },
        }),
      };
      return chain;
    },
  }),
}));
import { convertCustomCakeToOrder, quoteCustomCake } from "@/lib/actions/admin/custom-cake";
const input = { address: { line: "QA", city: "QA" }, paymentMethod: "cod" as const };
beforeEach(() => {
  vi.resetAllMocks();
  mock.cake = {
    status: "quoted",
    data: {
      customer_name: "QA",
      phone: "0900000000",
      email: "qa@example.test",
      size: "20cm",
      layers: 2,
      sponge: "vanilla",
      cream: "cream",
      flavor: "fruit",
      message_on_cake: "QA birthday",
      need_at: "2030-01-01T00:00:00Z",
      quoted_price: 100000,
    },
  };
  mock.rpc.mockResolvedValue({ error: null, data: { id: 7, created: true } });
  mock.send.mockResolvedValue({ sent: true });
});
it("requires admin authorization before any conversion or quote", async () => {
  mock.admin.mockRejectedValue(new Error("unauthorized"));
  await expect(convertCustomCakeToOrder(1, input)).rejects.toThrow("unauthorized");
  await expect(quoteCustomCake(1, 100000, "QA")).rejects.toThrow("unauthorized");
  expect(mock.rpc).not.toHaveBeenCalled();
});
it("commits an unpaid order with shipping and the original cake instructions", async () => {
  expect(await convertCustomCakeToOrder(1, input)).toEqual({ ok: true, id: 7 });
  const [name, args] = mock.rpc.mock.calls[0]!;
  expect(name).toBe("bakery_convert_custom_cake");
  expect(args.p_order.total).toBe(125000);
  expect(args.p_order.payment_status).toBe("unpaid");
  expect(args.p_order.items_snapshot[0].options.message_on_cake).toBe("QA birthday");
});
it("rejects invalid addresses, unavailable bank transfer and fractional quotes", async () => {
  expect(
    (await convertCustomCakeToOrder(1, { ...input, address: { line: "", city: "" } })).ok,
  ).toBe(false);
  expect(await convertCustomCakeToOrder(1, { ...input, paymentMethod: "bank_transfer" })).toEqual({
    ok: false,
    error: "payment_unavailable",
  });
  expect((await quoteCustomCake(1, 100.5, "QA")).ok).toBe(false);
  expect(mock.rpc).not.toHaveBeenCalled();
});
it("reports email failure without claiming the persisted quote failed", async () => {
  mock.send.mockResolvedValue({ sent: false });
  expect(await quoteCustomCake(1, 100000, "QA")).toEqual({
    ok: true,
    id: 1,
    error: "email_not_sent",
  });
});
it("fails closed when the conversion transaction is unavailable", async () => {
  mock.rpc.mockResolvedValue({ data: null, error: { message: "not installed" } });
  expect(await convertCustomCakeToOrder(1, input)).toEqual({
    ok: false,
    error: "conversion_failed",
  });
});
