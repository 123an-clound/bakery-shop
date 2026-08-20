import { describe, expect, it } from "vitest";

import { t } from "@/lib/i18n/text";

describe("t() i18n fallback", () => {
  it("returns the English value when locale is en and en is set", () => {
    expect(t({ vi: "Bánh kem", en: "Cake" }, "en")).toBe("Cake");
  });

  it("falls back to vi when locale is en but en is missing", () => {
    expect(t({ vi: "Bánh kem" }, "en")).toBe("Bánh kem");
  });

  it("returns vi when locale is vi, even if en is set", () => {
    expect(t({ vi: "Bánh kem", en: "Cake" }, "vi")).toBe("Bánh kem");
  });

  it("returns an empty string for a null/undefined field", () => {
    expect(t(null, "vi")).toBe("");
    expect(t(undefined, "en")).toBe("");
  });
});
