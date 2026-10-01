import { afterEach, describe, expect, it, vi } from "vitest";
import { getSiteUrl } from "@/lib/seo/site-url";

afterEach(() => vi.unstubAllEnvs());

describe("getSiteUrl", () => {
  it("uses the Vercel deployment hostname for a preview build", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", "bakery-preview-123.vercel.app");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");

    expect(getSiteUrl()).toBe("https://bakery-preview-123.vercel.app");
  });

  it("rejects an invalid Vercel preview hostname", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", "https://attacker.example/path");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");

    expect(() => getSiteUrl()).toThrow(
      "VERCEL_URL must be a valid preview hostname",
    );
  });

  it("still requires an explicit canonical URL for production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_URL", "bakery-shop.vercel.app");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");

    expect(() => getSiteUrl()).toThrow(
      "NEXT_PUBLIC_SITE_URL must be configured in production",
    );
  });

  it("uses localhost during local development when no URL is configured", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("VERCEL_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");

    expect(getSiteUrl()).toBe("http://localhost:3000");
  });
});
