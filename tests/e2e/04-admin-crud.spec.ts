import { test, expect, type Page } from "@playwright/test";
import { deleteBakeryRowsByType } from "./helpers/supabase-admin";

const createdProductIds: number[] = [];

test.afterAll(async () => {
  await deleteBakeryRowsByType("product", createdProductIds);
});

async function loginAsAdmin(page: Page) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("ADMIN_PASSWORD not set — is .env.local loaded?");
  await page.goto("/admin/login");
  await page.getByLabel("Mật khẩu").fill(password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test.describe("Admin CRUD → customer site (mục 13 scenarios 10-12)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // scenario 10: a product added in admin appears on the customer product listing.
  test("adding a product in admin makes it appear on the customer site", async ({ page, request }) => {
    const productName = `E2E Admin Test Product ${Date.now()}`;
    await page.goto("/admin/san-pham/new");
    await page.getByLabel("Tên sản phẩm *").fill(productName);
    await page.getByLabel("Giá gốc (₫) *").fill("111000");
    await page.getByRole("button", { name: "Xuất bản" }).click();
    await expect(page).toHaveURL(/\/admin\/san-pham$/);
    await expect(page.getByText(productName)).toBeVisible();

    const res = await request.get(`/san-pham?q=${encodeURIComponent(productName)}`);
    expect(res.ok()).toBeTruthy();
    const html = await res.text();
    expect(html).toContain(productName);
  });

  // scenario 11: changing the primary color in Theme Editor updates the CSS
  // variable the customer site actually renders with (after saving).
  test("changing the theme primary color updates the CSS variable on the customer site", async ({ page, context }) => {
    await page.goto("/admin/giao-dien");
    const primaryHexInput = page.locator("#color-hex-primary");
    const original = await primaryHexInput.inputValue();
    await primaryHexInput.fill("#22C55E");
    await primaryHexInput.blur();
    await page.getByRole("button", { name: "Lưu thay đổi" }).click();
    await expect(page.getByText("Đã lưu thay đổi")).toBeVisible({ timeout: 10_000 });

    const customerPage = await context.newPage();
    await customerPage.goto("/");
    const primaryVar = await customerPage.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--primary").trim(),
    );
    expect(primaryVar.toLowerCase()).toBe("#22c55e");
    await customerPage.close();

    // restore
    await primaryHexInput.fill(original);
    await primaryHexInput.blur();
    await page.getByRole("button", { name: "Lưu thay đổi" }).click();
    await expect(page.getByText("Đã lưu thay đổi")).toBeVisible({ timeout: 10_000 });
  });

  // scenario 12: disabling the "blog" section removes it from the home page.
  test("disabling the blog section removes it from the home page", async ({ page, context }) => {
    await page.goto("/admin/giao-dien");
    const blogRow = page.locator("div").filter({ hasText: /^Tin tức$/ }).last();
    const blogSwitch = blogRow.getByRole("switch");
    const originalState = await blogSwitch.getAttribute("data-state");

    // The seeded default theme ships with blog *disabled* — force it on
    // first so this test actually exercises "enabled -> disabled -> gone",
    // then restore whatever state it started in either way.
    try {
      if (originalState !== "checked") {
        await blogSwitch.click();
        await page.getByRole("button", { name: "Lưu thay đổi" }).click();
        await expect(page.getByText("Đã lưu thay đổi")).toBeVisible({ timeout: 10_000 });
      }

      // A static-shell page's DOM never refetches on its own, so retrying
      // expect() against one already-loaded document can't observe server
      // state converging — re-navigate on each poll attempt instead. Cache
      // tag invalidation (updateTag) is documented as immediate, but a
      // fresh Server Action write can still take a beat to be visible to
      // the very next request in practice; a few hundred ms of tolerance
      // here matches how a real customer refreshing a moment later would
      // experience it.
      const beforeDisable = await context.newPage();
      await expect
        .poll(async () => {
          await beforeDisable.goto("/");
          return beforeDisable.getByRole("heading", { name: "Tin tức & mẹo vặt" }).count();
        }, { timeout: 10_000 })
        .toBe(1);
      await beforeDisable.close();

      await blogSwitch.click();
      await page.getByRole("button", { name: "Lưu thay đổi" }).click();
      await expect(page.getByText("Đã lưu thay đổi")).toBeVisible({ timeout: 10_000 });

      const afterDisable = await context.newPage();
      await expect
        .poll(async () => {
          await afterDisable.goto("/");
          return afterDisable.getByRole("heading", { name: "Tin tức & mẹo vặt" }).count();
        }, { timeout: 10_000 })
        .toBe(0);
      await afterDisable.close();
    } finally {
      // restore to the exact original state
      const current = await blogSwitch.getAttribute("data-state");
      if (current !== originalState) {
        await blogSwitch.click();
        await page.getByRole("button", { name: "Lưu thay đổi" }).click();
        await expect(page.getByText("Đã lưu thay đổi")).toBeVisible({ timeout: 10_000 });
      }
    }
  });
});
