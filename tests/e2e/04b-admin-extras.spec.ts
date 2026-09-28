import { test, expect, type Page } from "@playwright/test";

async function loginAsAdmin(page: Page) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("ADMIN_PASSWORD not set — is .env.local loaded?");
  await page.goto("/admin/login");
  await page.getByLabel("Mật khẩu").fill(password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test.describe("Admin gaps closed against mục 9", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("dashboard shows the total products card (mục 9.1)", async ({ page }) => {
    await expect(page.getByText("Tổng sản phẩm")).toBeVisible();
  });

  test("orders list filters by date range and the CSV export honours it (mục 9.4)", async ({ page }) => {
    await page.goto("/admin/don-hang");
    await page.getByLabel("Từ ngày").fill("2000-01-01");
    await page.getByLabel("Đến ngày").fill("2000-01-02");
    await expect(page.getByText("Không tìm thấy đơn hàng nào.")).toBeVisible();

    const href = await page.getByRole("link", { name: "Xuất CSV" }).getAttribute("href");
    expect(href).toContain("dateFrom=2000-01-01");
    expect(href).toContain("dateTo=2000-01-02");

    const res = await page.request.get(href!);
    expect(res.ok()).toBeTruthy();
    const csv = await res.text();
    // Header only — no order was created in January 2000.
    expect(csv.trim().split("\n")).toHaveLength(1);
    expect(csv).toContain("Mã đơn");
  });

  test("customers page lists customers (mục 9.11)", async ({ page }) => {
    await page.goto("/admin/khach-hang");
    await expect(page.getByRole("heading", { name: "Khách hàng" })).toBeVisible();
    await expect(page.locator("tbody tr").first()).toBeVisible();
  });
});

test("live admin banners render on the home page (mục 9.7)", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Ưu đãi đang diễn ra" })).toBeVisible();
});
