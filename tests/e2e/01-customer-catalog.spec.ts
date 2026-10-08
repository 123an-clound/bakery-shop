import { test, expect } from "@playwright/test";

// mục 13 scenario 1: home loads with the configured number of sections.
test("home page loads with the theme-configured sections", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // Seeded theme enables 7 sections (hero, categories, featured, custom_cake,
  // best_sellers, story, newsletter) — hero renders as an <h1>, the rest as
  // section headings; just assert the page has multiple <section>-like
  // landmarks rather than hard-coding an exact count that would break the
  // moment an admin reorders/toggles sections in Theme Editor.
  await expect(page.getByRole("heading", { name: /Danh mục nổi bật/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Sản phẩm nổi bật/i })).toBeVisible();
});

// mục 13 scenario 2: unaccented search "banh kem" returns accented results.
test("unaccented search returns accented results", async ({ page }) => {
  await page.goto("/san-pham");
  const firstProduct = page.locator("main h3:has(a[href^='/san-pham/'])").first();
  const productName = (await firstProduct.innerText()).trim();
  const unaccentedName = productName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d");
  const query = unaccentedName.split(/\s+/).slice(0, 2).join(" ");

  expect(query.toLowerCase()).not.toBe(productName.toLowerCase().split(/\s+/).slice(0, 2).join(" "));
  await page.getByLabel("Tìm kiếm").fill(query);
  await expect.poll(() => new URL(page.url()).searchParams.get("q")).toBe(query);
  await expect(page.locator("main h3:has(a[href^='/san-pham/'])").first()).toContainText(productName);
});

// mục 13 scenario 3: category + price filter changes the URL and the results.
test("category and price filters change the URL and results", async ({ page }) => {
  await page.goto("/danh-muc/banh-kem-sinh-nhat");
  await expect(page).toHaveURL(/\/danh-muc\/banh-kem-sinh-nhat/);
  const categoryCount = await page.locator("main a[href*='/san-pham/']").count();
  expect(categoryCount).toBeGreaterThan(0);

  await page.goto("/san-pham?min=400000&max=500000");
  await expect(page).toHaveURL(/min=400000/);
  await expect(page).toHaveURL(/max=500000/);
  const prices = await page.locator("main").getByText(/\d[\d.]*\s*₫/).allTextContents();
  expect(prices.length).toBeGreaterThan(0);
});

test("mobile catalog keeps products in view and exposes filters as a keyboard disclosure", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/san-pham");

  const filters = page.locator("main details").first();
  await expect(filters).not.toHaveAttribute("open", "");
  await expect(page.getByLabel("Tìm kiếm")).toBeVisible();
  await expect(page.locator("main a[href^='/san-pham/']").first()).toBeInViewport();

  const disclosure = page.getByText("Bộ lọc sản phẩm", { exact: true });
  await disclosure.focus();
  await page.keyboard.press("Enter");
  await expect(filters).toHaveAttribute("open", "");
  await expect(page.getByRole("button", { name: "Tất cả" })).toBeVisible();
});

// mục 13 scenario 13: switching to EN changes UI strings; content without an
// EN translation falls back to VI (t() helper — see tests/unit/i18n-text.test.ts
// for the pure-function coverage of the fallback itself).
test("switching language to EN changes UI strings and falls back to VI for missing content", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Tiếng Việt/i }).click();
  await page.getByRole("menuitem", { name: /English/i }).click();
  await expect(page).toHaveURL(/\/en(\/|$)/);
  await expect(page.getByRole("navigation").getByRole("link", { name: "Menu", exact: true })).toBeVisible();

  // Static pages seeded with VI-only content should still render (fallback),
  // not a blank/missing string.
  await page.goto("/en/gioi-thieu");
  await expect(page.locator("main")).not.toBeEmpty();
});
