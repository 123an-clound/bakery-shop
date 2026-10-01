import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

// Safe read-only browser lane: excludes existing tests that write to shared Supabase.
export default defineConfig({
  ...base,
  testMatch: /(?:01-customer-catalog|06-accessibility|07-scene-3d|08-storefront-readability|09-checkout-safety)\.spec\.ts/,
  use: { ...base.use, baseURL: "http://localhost:3100", trace: "off" },
  outputDir: ".playwright-mcp/handoff/browser-results",
  webServer: undefined,
});
