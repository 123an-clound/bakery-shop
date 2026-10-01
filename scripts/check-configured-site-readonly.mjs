// Safe read-only smoke test for the configured public origin. This script only
// performs GET requests and does not submit forms, log in, or open admin actions.
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { loadEnvFile } from 'node:process';

loadEnvFile('.env.local');
const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? '');
assert.equal(origin.protocol, 'https:', 'Refusing to crawl a non-HTTPS site');
assert.ok(!['localhost', '127.0.0.1'].includes(origin.hostname), 'Expected configured public origin');

const routes = [
  '/', '/san-pham', '/danh-muc/banh-kem-sinh-nhat',
  '/san-pham/banh-kem-dau-tay-1', '/gio-hang', '/thanh-toan',
  '/tra-cuu-don-hang', '/robots.txt', '/sitemap.xml',
];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ locale: 'vi-VN', reducedMotion: 'reduce' });
const output = { host: origin.host, pages: [], runtimeErrors: 0, securityHeaders: {} };
try {
  await context.route('**/*', (route) => {
    const method = route.request().method();
    return ['GET', 'HEAD'].includes(method) ? route.continue() : route.abort();
  });
  const page = await context.newPage();
  page.on('pageerror', () => output.runtimeErrors++);
  for (const path of routes) {
    const url = new URL(path, origin);
    const response = await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    assert.ok(response, `No response for ${path}`);
    await page.waitForLoadState('load', { timeout: 10_000 }).catch(() => {});
    const headers = response.headers();
    const fields = await page.evaluate(() => ({
      title: document.title.length > 0,
      description: Boolean(document.querySelector('meta[name="description"]')?.content),
      canonical: document.querySelector('link[rel="canonical"]')?.href ?? null,
      robots: document.querySelector('meta[name="robots"]')?.content ?? null,
      schemaValid: [...document.querySelectorAll('script[type="application/ld+json"]')]
        .every((node) => { try { JSON.parse(node.textContent); return true; } catch { return false; } }),
      brokenImages: [...document.images].filter((image) => image.complete && !image.naturalWidth).length,
    }));
    output.pages.push({
      path, status: response.status(), ...fields,
      contentType: headers['content-type'] ?? null,
      hsts: Boolean(headers['strict-transport-security']),
      csp: Boolean(headers['content-security-policy']),
      frameOptions: headers['x-frame-options'] ?? null,
    });
    if (path === '/') output.securityHeaders = {
      hsts: Boolean(headers['strict-transport-security']),
      csp: Boolean(headers['content-security-policy']),
      frameOptions: headers['x-frame-options'] ?? null,
      referrerPolicy: headers['referrer-policy'] ?? null,
    };
  }
  const sitemap = output.pages.find((pageResult) => pageResult.path === '/sitemap.xml');
  assert.ok([200, 304].includes(sitemap.status), 'Sitemap did not load');
  const xml = await (await fetch(new URL('/sitemap.xml', origin))).text();
  const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const sitemapResponses = [];
  for (let index = 0; index < locations.length; index += 5) {
    const batch = locations.slice(index, index + 5);
    sitemapResponses.push(...await Promise.all(batch.map(async (location) => {
      const target = new URL(location);
      if (target.origin !== origin.origin) return { status: 0, path: target.pathname };
      try {
        const response = await fetch(target, { redirect: 'manual' });
        return { status: response.status, path: target.pathname };
      } catch {
        return { status: 0, path: target.pathname };
      }
    })));
  }
  const robotsText = await (await fetch(new URL('/robots.txt', origin))).text();
  output.sitemap = {
    count: locations.length,
    unique: new Set(locations).size,
    offOrigin: locations.filter((location) => new URL(location).origin !== origin.origin).length,
    successfulGets: sitemapResponses.filter((entry) => entry.status >= 200 && entry.status < 300).length,
    badGets: sitemapResponses.filter((entry) => entry.status < 200 || entry.status >= 400),
  };
  output.robots = {
    hasSitemapReference: robotsText.toLowerCase().includes('/sitemap.xml'),
    disallowsAll: /^\s*disallow:\s*\/\s*$/im.test(robotsText),
  };
  console.log(JSON.stringify(output, null, 2));
} finally {
  await context.close();
  await browser.close();
}
