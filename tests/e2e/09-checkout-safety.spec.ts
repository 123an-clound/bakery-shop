import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  // All mutations are intercepted by this file; nothing reaches a real order API.
  await page.route("**/api/orders", route => route.fulfill({ status: 503, json: { error: "server_error" } }));
});

async function checkout(page: import("@playwright/test").Page) {
  await page.goto("/san-pham/banh-kem-dau-tay-1");
  await page.getByRole("button", { name: "Thêm vào giỏ", exact: true }).click();
  await page.goto("/gio-hang");
  await expect(page.locator("#coupon-input")).toBeVisible();
  await page.reload();
  await expect(page.locator("#coupon-input")).toBeVisible();
  await page.goto("/thanh-toan");
  await page.locator("#checkout-name").fill("QA Sandbox");
  await page.locator("#checkout-phone").fill("0900000000");
  await page.locator("#checkout-address-line").fill("QA Address");
  await page.locator("#checkout-city").fill("QA City");
  await page.locator("#checkout-delivery-at").fill("2027-01-01T12:00");
}

test("failed checkout preserves values and retries the same idempotency key", async ({ page }) => {
  const requests: Array<Record<string, unknown>> = [];
  await page.route("**/api/orders", route => {
    requests.push(route.request().postDataJSON());
    return route.fulfill({ status: 503, json: { error: "server_error" } });
  });
  await checkout(page);
  await page.getByRole("button", { name: "Đặt hàng", exact: true }).click();
  await expect(page.locator("form").getByRole("alert")).toBeVisible();
  await expect(page.locator("#checkout-name")).toHaveValue("QA Sandbox");
  await page.getByRole("button", { name: "Đặt hàng", exact: true }).click();
  await expect.poll(() => requests.length).toBe(2);
  expect(requests[0]!.requestId).toBe(requests[1]!.requestId);
  expect(requests[0]!.expectedTotal).toBeGreaterThan(0);
  await expect(page.getByTestId("scene-canvas")).toHaveCount(0);
});

test("a changed price is shown for review and is never automatically resubmitted", async ({ page }) => {
  let count = 0;
  await page.route("**/api/orders", route => {
    count++;
    const request = route.request().postDataJSON();
    return route.fulfill({ status: 409, json: { error: "price_changed", total: 9025000, discount: 0, shippingFee: 25000, freeFrom: 99000000, prices: request.items.map((item: { productId: number; options: Record<string,string> }) => ({ ...item, unitPrice: 9000000 })) } });
  });
  await checkout(page);
  await page.getByRole("button", { name: "Đặt hàng", exact: true }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText("Tổng tiền đã cập nhật");
  await expect(page.getByText(/9\.025\.000/)).toBeVisible();
  expect(count).toBe(1);
  await expect(page.locator("#checkout-address-line")).toHaveValue("QA Address");
});

test("a simulated successful checkout clears the cart and opens the receipt route", async ({ page }) => {
  await page.route("**/api/orders", route => route.fulfill({ status: 201, json: { code: "BK260930-9999", total: 100000 } }));
  await checkout(page);
  await page.getByRole("button", { name: "Đặt hàng", exact: true }).click();
  await expect(page).toHaveURL(/dat-hang-thanh-cong\/BK260930-9999/);
  // No real receipt cookie: actual server must deny the forged success URL.
  await expect(page.getByText("404", { exact: true })).toBeVisible();
  await page.goto("/gio-hang");
  await expect(page.locator("#coupon-input")).toHaveCount(0);
});

test("transactional metadata and paginated canonical URLs", async ({ page, request }) => {
  await page.goto("/thanh-toan");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await page.goto("/san-pham?page=2");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /san-pham\?page=2$/);
  await page.goto("/san-pham?q=banh");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  const response = await request.get("/dat-hang-thanh-cong/BK260930-9999");
  expect(response.headers()["x-robots-tag"]).toContain("noindex");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/en</loc>");
  expect(sitemap).not.toContain("tra-cuu-don-hang");
});
