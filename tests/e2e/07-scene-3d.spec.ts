import { test, expect } from "@playwright/test";

test("homepage mounts the 3D canvas and the hero CTA stays clickable", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("scene-canvas")).toHaveAttribute("data-ready", "true");
  await expect(page.getByRole("link", { name: "Trang chủ", exact: true }).first()).toHaveAttribute(
    "aria-current",
    "page",
  );
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

test("navigating from home unloads WebGL on the catalog and keeps the static scene backdrop", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("scene-canvas")).toHaveAttribute("data-ready", "true");

  await page.getByRole("link", { name: /xem thực đơn|san phẩm/i }).first().click();
  await expect(page).toHaveURL(/\/san-pham/);

  await expect(page.getByTestId("scene-canvas")).toHaveCount(0);
  await expect(page.getByTestId("scene-fallback")).toBeVisible();

  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(hasOverflow).toBe(false);
  await expect(page.locator("main")).toBeVisible();
});
