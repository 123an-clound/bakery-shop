import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// These checks only read public pages; no shared customer data is changed.
test.describe.configure({ mode: "parallel" });

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];
const routes = [
  "/san-pham",
  "/san-pham/banh-kem-dau-tay-1",
  "/danh-muc/banh-kem-sinh-nhat",
  "/gio-hang",
  "/thanh-toan",
  "/tra-cuu-don-hang",
  "/dat-banh-theo-yeu-cau",
  "/gioi-thieu",
  "/lien-he",
  "/dieu-khoan",
  "/chinh-sach-giao-hang",
  "/tin-tuc",
  "/tin-tuc/xu-huong-banh-cuoi-pastel-2026",
  "/tai-khoan/dang-nhap",
  "/tai-khoan/dang-ky",
];

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  // Scroll reveals start asynchronously and can have a staggered delay.
  await expect
    .poll(
      () =>
        page.locator("main").evaluate((main) =>
          [...main.querySelectorAll<HTMLElement>("[style]")]
            .filter((el) => {
              const rect = el.getBoundingClientRect();
              return (
                rect.width > 0 &&
                rect.height > 0 &&
                rect.bottom > 80 &&
                rect.top < innerHeight - 80 &&
                el.style.opacity &&
                Number(getComputedStyle(el).opacity) < 0.99
              );
            })
            .map((el) => el.textContent?.trim().slice(0, 80)),
        ),
      { timeout: 15_000 },
    )
    .toEqual([]);
}

/** A foreground color alone cannot protect text from a moving WebGL backdrop.
 * Every visible text run must have a solid or contrast-tested frosted surface
 * above the scene, before reaching <body> (whose background is UNDER the scene).
 */
async function expectProtectedText(page: Page) {
  const exposed = await page.evaluate(() => {
    const failures: string[] = [];
    const root = document.body;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const el = node.parentElement;
      const text = node.textContent?.trim();
      if (
        !el ||
        !text ||
        el.closest("script, style, svg, [aria-hidden='true'], .sr-only, nextjs-portal")
      )
        continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      const rect = range.getBoundingClientRect();
      if (
        !rect.width ||
        !rect.height ||
        rect.bottom < 0 ||
        rect.top > innerHeight ||
        rect.right < 0 ||
        rect.left > innerWidth
      )
        continue;
      let surface = false;
      let visible = true;
      for (
        let parent: HTMLElement | null = el;
        parent && parent !== document.body;
        parent = parent.parentElement
      ) {
        const style = getComputedStyle(parent);
        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          Number(style.opacity) < 0.99
        )
          visible = false;
        const box = parent.getBoundingClientRect();
        const color = style.backgroundColor;
        const alpha =
          color === "transparent"
            ? 0
            : color.startsWith("rgba(")
              ? Number(color.split(",").at(-1)?.replace(")", ""))
              : color.includes("/")
                ? Number(color.split("/").at(-1)?.replace(")", ""))
                : 1;
        const protectedFill =
          alpha >= 0.99 || (alpha >= 0.6 && style.backdropFilter.includes("blur("));
        if (protectedFill && box.top <= rect.top + 1 && box.bottom >= rect.bottom - 1)
          surface = true;
      }
      if (visible && !surface) failures.push(text.slice(0, 90));
    }
    return [...new Set(failures)];
  });
  expect(exposed, "Text exposed to the moving scene at this scroll position").toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
}

/** Check the tint over both extremes of a moving backdrop, including the
 * brightest highlight. Axe alone cannot model pixels from a WebGL canvas. */
async function expectFrostedPalette(page: Page) {
  const ratios = await page.locator(".storefront-hero-copy").evaluate((surface) => {
    const style = getComputedStyle(surface);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d")!;
    const rgba = (color: string) => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      return [...ctx.getImageData(0, 0, 1, 1).data].map((v) => v / 255);
    };
    const over = (fill: number[], base: number[]) =>
      base.slice(0, 3).map((v, i) => fill[i]! * fill[3]! + v * (1 - fill[3]!));
    const luminance = (color: number[]) =>
      color
        .slice(0, 3)
        .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
        .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i]!, 0);
    const fill = rgba(style.backgroundColor);
    const highlight = rgba(style.getPropertyValue("--frost-highlight"));
    const backgrounds = [0, 1].flatMap((value) => {
      const base = over(fill, [value, value, value]);
      return [base, over(highlight, base)];
    });
    return ["--foreground", "--muted-foreground", "--brand-accent", "--destructive"].map(
      (token) => {
        const foreground = luminance(rgba(style.getPropertyValue(token)));
        const minimum = Math.min(
          ...backgrounds.map((bg) => {
            const background = luminance(bg);
            return (
              (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05)
            );
          }),
        );
        return { token, minimum };
      },
    );
  });
  for (const { token, minimum } of ratios) {
    expect(minimum, `${token} against the worst-case frosted backdrop`).toBeGreaterThanOrEqual(4.5);
  }
}

async function expectTextContrast(page: Page) {
  const result = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
  expect(
    result.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({ target: n.target, reason: n.failureSummary })),
    })),
  ).toEqual([]);
}

for (const viewport of viewports) {
  for (const mode of ["light", "dark"] as const) {
    test.describe(`${viewport.name} ${mode}`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } });
      test.beforeEach(async ({ page }) => {
        await page.addInitScript((theme) => localStorage.setItem("theme", theme), mode);
      });

      test("home text stays readable throughout scrolling", async ({ page }, info) => {
        test.setTimeout(180_000);
        await page.goto("/", { waitUntil: "domcontentloaded" });
        await settle(page);
        await expectProtectedText(page);
        await expectFrostedPalette(page);
        const sections = page.locator("main section");
        for (const section of await sections.all()) {
          await section.evaluate((el) =>
            el.scrollIntoView({ block: "start", behavior: "instant" }),
          );
          await settle(page);
          await expectProtectedText(page);
          if (await section.locator("dl").count()) {
            await page.screenshot({ path: info.outputPath("story.png") });
          }
        }
        await page.locator("footer").scrollIntoViewIfNeeded();
        await settle(page);
        await expectProtectedText(page);
        await page.screenshot({ path: info.outputPath("footer.png") });
        await expectTextContrast(page);
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
        await settle(page);
        await page.screenshot({ path: info.outputPath("hero.png") });
      });

      test("menus and populated checkout have readable text", async ({ page }) => {
        test.setTimeout(90_000);
        // Also cover the static fallback. Cart changes stay in this browser;
        // no checkout is submitted and no order is created.
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.goto("/san-pham/banh-kem-dau-tay-1", { waitUntil: "domcontentloaded" });
        await settle(page);
        await page.getByRole("button", { name: "Thêm vào giỏ", exact: true }).click();
        await page
          .getByRole("banner")
          .getByRole("button", { name: "Giỏ hàng", exact: true })
          .click();
        await expect(page.getByRole("dialog")).toBeVisible();
        await expectTextContrast(page);
        await expectProtectedText(page);
        await page.keyboard.press("Escape");
        if (viewport.name === "mobile") {
          await page.getByRole("button", { name: "Menu", exact: true }).click();
          await expect(page.getByRole("dialog")).toBeVisible();
          await expectTextContrast(page);
          await expectProtectedText(page);
          await page.keyboard.press("Escape");
        }
        await page.goto("/gio-hang", { waitUntil: "domcontentloaded" });
        await expect(page.locator("#coupon-input")).toBeVisible();
        await settle(page);
        await expectProtectedText(page);
        await expectTextContrast(page);
        await page.goto("/thanh-toan", { waitUntil: "domcontentloaded" });
        await expect(page.locator("#checkout-name")).toBeVisible();
        await settle(page);
        await expectProtectedText(page);
        await expectTextContrast(page);
        await page.locator("#checkout-city").scrollIntoViewIfNeeded();
        await expectProtectedText(page);
      });

      for (const route of routes) {
        test(`readable surfaces and contrast: ${route}`, async ({ page }, info) => {
          test.setTimeout(90_000);
          await page.goto(route, { waitUntil: "domcontentloaded" });
          await settle(page);
          await expectProtectedText(page);
          await expectTextContrast(page);
          if (route === "/san-pham/banh-kem-dau-tay-1") {
            await page.screenshot({ path: info.outputPath("product.png") });
          }
          await page.locator("footer").scrollIntoViewIfNeeded();
          await settle(page);
          await expectProtectedText(page);
        });
      }
    });
  }
}
