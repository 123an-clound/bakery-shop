import { describe, expect, it } from "vitest";
import { shopDatetimeToIso, toShopDatetimeValue } from "@/lib/utils/datetime-local";
describe("shop delivery clock", () => {
  it("round trips Vietnam time regardless of machine timezone", () => {
    const iso = shopDatetimeToIso("2026-10-02T12:30");
    expect(iso).toBe("2026-10-02T05:30:00.000Z");
    expect(toShopDatetimeValue(new Date(iso))).toBe("2026-10-02T12:30");
  });
  it("rejects calendar rollover and malformed values", () => {
    expect(() => shopDatetimeToIso("2026-02-30T12:00")).toThrow();
    expect(() => shopDatetimeToIso("2026-10-02T12:00Z")).toThrow();
  });
});
