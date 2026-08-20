import { defineConfig, devices } from "@playwright/test";

// Next.js loads .env.local itself for the webServer process, but the
// Playwright test runner (this process) needs it too, e.g. to type the real
// ADMIN_PASSWORD in the admin-login e2e test.
try {
  process.loadEnvFile(".env.local");
} catch {
  // .env.local not present (e.g. CI) — tests that need it will fail loudly instead.
}

/**
 * Phase 7 e2e suite (mục 13). Runs against a real `next build && next start`
 * (not dev mode) so results match what a real deploy would behave like —
 * `webServer` below builds once, then starts the production server.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // shared Supabase project — avoid cross-test data races
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // Chromium's default Accept-Language (en-US) made next-intl's automatic
    // locale negotiation serve English content at "/" in a fresh context,
    // breaking every VI-default assertion — force vi-VN so tests are
    // deterministic regardless of the runner's system locale.
    locale: "vi-VN",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "pnpm build && pnpm start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
