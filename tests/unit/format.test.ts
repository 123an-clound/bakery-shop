import { describe, expect, it } from "vitest";

import { formatMoney, slugify } from "@/lib/utils/format";

describe("formatMoney", () => {
  it("formats VND for vi locale with the dong sign", () => {
    // Intl.NumberFormat separates the amount and currency symbol with a
    // non-breaking space (U+00A0) — normalize before comparing.
    expect(formatMoney(350000, "vi").replace(/\s/g, " ")).toBe("350.000 ₫");
  });

  it("formats a suffixed VND for en locale", () => {
    expect(formatMoney(350000, "en")).toBe("350,000 VND");
  });

  it("handles zero", () => {
    expect(formatMoney(0, "vi").replace(/\s/g, " ")).toBe("0 ₫");
  });
});

describe("slugify", () => {
  it("strips Vietnamese diacritics and spaces", () => {
    expect(slugify("Bánh kem dâu tây")).toBe("banh-kem-dau-tay");
  });

  it("handles đ/Đ specially (NFD doesn't decompose it)", () => {
    expect(slugify("Đặt bánh theo yêu cầu")).toBe("dat-banh-theo-yeu-cau");
  });

  it("collapses repeated separators and trims edges", () => {
    expect(slugify("  Bánh   Mì!!  ")).toBe("banh-mi");
  });
});
