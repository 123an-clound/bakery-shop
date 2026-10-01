// Read-only lab measurements. No orders, uploads, emails or remote mutations.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const phase = process.argv[2] ?? 'baseline';
const origin = process.env.QA_BASE_URL ?? 'http://localhost:3100';
if (!['localhost', '127.0.0.1'].includes(new URL(origin).hostname)) throw new Error('Local QA only');
const dir = `.playwright-mcp/handoff/${phase}`;
await mkdir(dir, { recursive: true });
const browser = await chromium.launch();
const results = [];
for (const mobile of [false, true]) {
  for (const path of ['/', '/danh-muc/banh-kem-sinh-nhat', '/san-pham/banh-kem-dau-tay-1', '/gio-hang', '/thanh-toan']) {
    for (let run = 1; run <= 3; run++) {
      const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, locale: 'vi-VN' });
      await context.route('**/*', route => ['GET', 'HEAD'].includes(route.request().method()) ? route.continue() : route.abort());
      const page = await context.newPage();
      let errors = 0;
      let failedRequests = 0;
      page.on('pageerror', () => errors++);
      page.on('requestfailed', () => failedRequests++);
      await page.addInitScript(() => {
        window.__qa = { lcp: 0, cls: 0, longTaskMs: 0, lcpElement: '' };
        new PerformanceObserver(list => { for (const e of list.getEntries()) { window.__qa.lcp = e.startTime; window.__qa.lcpElement = e.element?.tagName ?? ''; } }).observe({type: 'largest-contentful-paint', buffered: true});
        new PerformanceObserver(list => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__qa.cls += e.value; }).observe({type: 'layout-shift', buffered: true});
        new PerformanceObserver(list => { for (const e of list.getEntries()) window.__qa.longTaskMs += e.duration; }).observe({type: 'longtask', buffered: true});
      });
      // Populate cart via the real UI before measuring cart/checkout; no submit.
      if (['/gio-hang', '/thanh-toan'].includes(path)) {
        await page.goto(`${origin}/san-pham/banh-kem-dau-tay-1`);
        await page.getByRole('button', { name: 'Thêm vào giỏ', exact: true }).click();
      }
      const cdp = await context.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
      if (mobile) {
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
        await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 40, downloadThroughput: 1_250_000, uploadThroughput: 625_000 });
      }
      const response = await page.goto(`${origin}${path}`, { waitUntil: 'load' });
      await page.waitForTimeout(4000);
      const metrics = await page.evaluate(() => ({ ...window.__qa,
        ttfb: performance.getEntriesByType('navigation')[0].responseStart,
        transferBytes: performance.getEntriesByType('resource').reduce((sum, r) => sum + r.transferSize, 0),
        jsBytes: performance.getEntriesByType('resource').filter(r => r.name.includes('.js')).reduce((sum, r) => sum + r.transferSize, 0),
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        title: document.title,
        canonical: document.querySelector('link[rel="canonical"]')?.href,
        robots: document.querySelector('meta[name="robots"]')?.content,
      }));
      const entry = { path, device: mobile ? 'mobile' : 'desktop', run, status: response.status(), errors, failedRequests, ...metrics };
      results.push(entry);
      console.log(JSON.stringify(entry));
      if (run === 1) await page.screenshot({ path: `${dir}/${mobile ? 'mobile' : 'desktop'}-${path.replaceAll('/', '_') || 'home'}.png` });
      await context.close();
      await writeFile(`${dir}/metrics.json`, JSON.stringify({ browser: browser.version(), origin, mobile: '390x844, CPU 4x, 40ms latency, 10Mbps down, cache disabled', desktop: '1440x900, native CPU/network, cache disabled', observationMs: 4000, results }, null, 2));
    }
  }
}
await browser.close();
