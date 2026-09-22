import { test, expect } from "@playwright/test";

test("homepage mounts the 3D canvas and the hero CTA stays clickable", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("scene-canvas")).toBeVisible();
  const cta = page.getByRole("link", { name: /đặt bánh ngay/i }).first();
  await expect(cta).toBeVisible();
  await cta.click();
  await expect(page).toHaveURL(/\/san-pham/);
});

test("prefers-reduced-motion: reduce shows the static fallback instead of the canvas", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByTestId("scene-fallback")).toBeVisible();
  await expect(page.getByTestId("scene-canvas")).toHaveCount(0);
});

test("navigating from home to another route keeps the layout intact (no blank/broken canvas layer)", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("scene-canvas")).toBeVisible();
  await page.getByRole("link", { name: /xem thực đơn|san phẩm/i }).first().click();
  await expect(page).toHaveURL(/\/san-pham/);
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(hasOverflow).toBe(false);
  await expect(page.locator("main")).toBeVisible();
});
