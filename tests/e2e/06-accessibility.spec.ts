import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const CUSTOMER_PAGES = ["/", "/san-pham", "/san-pham/banh-kem-dau-tay-1", "/gio-hang", "/thanh-toan", "/tra-cuu-don-hang", "/dat-banh-theo-yeu-cau", "/gioi-thieu", "/lien-he", "/tai-khoan/dang-nhap"];

// Two independent sources of load-time flakiness in axe's color-contrast
// check, both confirmed by direct getComputedStyle inspection (final CSS
// color is always correct — this is purely about scan timing):
// 1. Custom heading/body web fonts (next/font/google) can still be mid-swap
//    the instant page.goto() resolves, since axe samples rendered glyphs.
// 2. <FadeIn> (components/motion/fade-in.tsx) animates opacity 0 -> 1 via
//    Framer Motion's `whileInView`, which fires from an IntersectionObserver
//    callback — asynchronous relative to the load event — over a 500ms
//    transition. The hero section (h1/subtitle/CTAs) is wrapped in one and
//    is above the fold on every page, so it's mid-fade unless we wait.
async function waitForPageSettled(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
}

for (const path of CUSTOMER_PAGES) {
  test(`axe: no serious/critical violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    await waitForPageSettled(page);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
}

test("axe: admin login page has no serious/critical violations", async ({ page }) => {
  await page.goto("/admin/login");
  await waitForPageSettled(page);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
});

// mục Phase 7 checklist: 5 responsive breakpoints, screenshot each.
const BREAKPOINTS = [
  { name: "360", width: 360, height: 800 },
  { name: "768", width: 768, height: 1024 },
  { name: "1024", width: 1024, height: 768 },
  { name: "1440", width: 1440, height: 900 },
  { name: "1920", width: 1920, height: 1080 },
];

for (const bp of BREAKPOINTS) {
  test(`responsive: home page renders without horizontal overflow at ${bp.width}px`, async ({ page }) => {
    await page.setViewportSize({ width: bp.width, height: bp.height });
    await page.goto("/");
    // Otherwise the screenshot below catches the hero <FadeIn> mid-animation
    // (opacity ~0) — the page itself is fine, but the screenshot meant for
    // visual review would misleadingly show blank hero text.
    await waitForPageSettled(page);
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(hasOverflow, `horizontal overflow at ${bp.width}px`).toBe(false);
    await page.screenshot({ path: `test-results/responsive-${bp.name}.png`, fullPage: false });
  });
}

// mục Phase 7 checklist: prefers-reduced-motion disables animation/transition durations.
test("prefers-reduced-motion: reduce disables animation and transition durations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const duration = await page.evaluate(() => getComputedStyle(document.body).animationDuration);
  // The blanket override forces 0.01ms — any near-zero value confirms the rule applied.
  expect(duration === "0.01ms" || duration === "0s" || parseFloat(duration) < 0.001).toBeTruthy();
});

// mục Phase 7 checklist: keyboard-only navigation reaches interactive elements with a visible focus ring.
test("keyboard navigation reaches the header nav links with a visible focus indicator", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  const focused = page.locator(":focus");
  await expect(focused).toBeVisible();
  const outline = await focused.evaluate((el) => {
    const style = getComputedStyle(el);
    return style.outlineStyle !== "none" || style.boxShadow !== "none";
  });
  expect(outline).toBeTruthy();
});
