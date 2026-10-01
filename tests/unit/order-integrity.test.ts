import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { signOrderAccess, verifyOrderAccess } from "@/lib/auth/order-access";
import { priceOrderItems } from "@/lib/bakery/order-pricing";
import { orderInputSchema } from "@/lib/schemas/order-input";

const now = Date.parse("2026-09-30T00:00:00Z");
const input = orderInputSchema.parse({ requestId: "a4625101-035e-4f54-9e42-a749705a3751", expectedTotal: 150000,
  customerName: "QA", phone: "0900000000", address: { line: "QA", city: "QA" }, deliveryAt: "2026-10-02T00:00:00Z", paymentMethod: "cod",
  items: [{ productId: 1, qty: 1, options: { size: "large" } }] });
const product = { id: 1, data: { name: { vi: "QA Cake" }, price: 100000, stock: 3, prep_time_hours: 24,
  options: [{ key: "size", label: { vi: "Size" }, choices: [{ value: "large", label: { vi: "Large" }, price_delta: 50000 }] }] } };

afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });
describe("checkout pricing boundary", () => {
  it("uses server prices and selected variant surcharges", () => expect(priceOrderItems(input, [product], now)[0]?.unit_price).toBe(150000));
  it("rejects omitted required options", () => expect(() => priceOrderItems({ ...input, items: [{ ...input.items[0]!, options: {} }] }, [product], now)).toThrow("invalid_option"));
  it("rejects invented options", () => expect(() => priceOrderItems({ ...input, items: [{ ...input.items[0]!, options: { size: "fake" } }] }, [product], now)).toThrow("invalid_option"));
  it("aggregates stock across duplicate lines", () => expect(() => priceOrderItems({ ...input, items: [{ ...input.items[0]!, qty: 2 }, { ...input.items[0]!, qty: 2 }] }, [product], now)).toThrow("out_of_stock"));
  it("enforces the product preparation time on the server", () => expect(() => priceOrderItems({ ...input, deliveryAt: "2026-09-30T12:00:00Z" }, [product], now)).toThrow("delivery_too_soon"));
  it("rejects unavailable products", () => expect(() => priceOrderItems(input, [], now)).toThrow("product_not_found"));
  it("rejects negative totals from option deltas", () => expect(() => priceOrderItems(input, [{ ...product, data: { ...product.data, price: 1, options: [{ ...product.data.options[0]!, choices: [{ value: "large", label: { vi: "Large" }, price_delta: -2 }] }] } }], now)).toThrow("invalid_price"));
  it("does not charge a sale price above the regular price", () => expect(priceOrderItems(input, [{ ...product, data: { ...product.data, sale_price: 200000 } }], now)[0]?.unit_price).toBe(150000));
  it("rejects timezone-less input and fractional money", () => {
    expect(orderInputSchema.safeParse({ ...input, deliveryAt: "2026-10-02T10:00" }).success).toBe(false);
    expect(orderInputSchema.safeParse({ ...input, expectedTotal: 1.5 }).success).toBe(false);
  });
});
describe("receipt access", () => {
  it("requires a valid signature bound to the exact order", () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "qa-only-secret-000000000000000000000");
    const token = signOrderAccess("BK260930-1234");
    expect(verifyOrderAccess("BK260930-1234", token)).toBe(true);
    expect(verifyOrderAccess("BK260930-1235", token)).toBe(false);
    expect(verifyOrderAccess("BK260930-1234", token + "x")).toBe(false);
    expect(verifyOrderAccess("BK260930-1234", undefined)).toBe(false);
    vi.useFakeTimers(); vi.setSystemTime(Date.now() + 25 * 3600000);
    expect(verifyOrderAccess("BK260930-1234", token)).toBe(false);
  });
});
