// Local read-only smoke checks. Never capture admin/customer data in artifacts.
import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
process.loadEnvFile('.env.local');
const origin = process.env.QA_BASE_URL ?? 'http://localhost:3100';
assert.ok(['localhost','127.0.0.1'].includes(new URL(origin).hostname));
const browser = await chromium.launch();
const context = await browser.newContext({locale:'vi-VN',reducedMotion:'reduce'});
await context.route('**/*',route=>{
  const request=route.request();
  const url=new URL(request.url());
  if (['GET','HEAD'].includes(request.method()) || (url.origin===origin && ['/api/admin/login','/api/admin/logout'].includes(url.pathname))) return route.continue();
  return route.abort();
});
const page=await context.newPage();
const result={pages:[],admin:[],sitemap:{},security:{}};
let runtimeErrors=0;
page.on('pageerror',()=>runtimeErrors++);
const paths=['/','/san-pham','/danh-muc/banh-kem-sinh-nhat','/san-pham/banh-kem-dau-tay-1','/gio-hang','/thanh-toan','/tra-cuu-don-hang','/en/san-pham','/san-pham?page=999999','/san-pham?page=1.5','/danh-muc/banh-kem-sinh-nhat?page=999999','/san-pham/qa-nonexistent-product'];
for(const path of paths){
  const response=await page.goto(origin+path);
  const fields=await page.evaluate(()=>({title:Boolean(document.title),h1:document.querySelectorAll('h1').length,
    description:Boolean(document.querySelector('meta[name="description"]')?.content),
    canonical:document.querySelector('link[rel="canonical"]')?.getAttribute('href'),robots:document.querySelector('meta[name="robots"]')?.getAttribute('content'),
    schema:[...document.querySelectorAll('script[type="application/ld+json"]')].map(el=>{try{const s=JSON.parse(el.textContent);return{type:s['@type'],context:s['@context'],offer:s.offers?{price:s.offers.price,currency:s.offers.priceCurrency,availability:s.offers.availability}:undefined};}catch{return {invalid:true};}}),
    brokenImages:[...document.images].filter(i=>i.complete&&!i.naturalWidth).length,
  }));
  result.pages.push({path,status:response.status(),...fields});
  if(path.includes('999999')||path.includes('1.5')||path.includes('qa-nonexistent')) assert.ok(response.status()===404||fields.robots?.includes('noindex'),'Missing route must be excluded from index');
  assert.ok(fields.schema.every(s=>!s.invalid),'JSON-LD must parse');
}
const sitemap=await (await context.request.get(origin+'/sitemap.xml')).text();
const urls=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1].replaceAll('&amp;','&'));
result.sitemap={count:urls.length,unique:new Set(urls).size,invalid:[]};
for(const url of urls){
  const local=new URL(url);const path=local.pathname+local.search;
  const response=await context.request.get(origin+path);
  if(response.status()!==200)result.sitemap.invalid.push({path,status:response.status()});
}
assert.equal(result.sitemap.invalid.length,0,'Sitemap contains non-200 routes');
assert.equal(urls.length,new Set(urls).size,'Sitemap contains duplicate URLs');
const denied=await context.request.get(origin+'/api/admin/orders/export');
result.security.unauthenticatedExport=denied.status();assert.equal(denied.status(),401);
const login=await context.request.post(origin+'/api/admin/login',{data:{password:process.env.ADMIN_PASSWORD}});
assert.equal(login.status(),200,'Local admin login failed');
for(const path of ['/admin','/admin/san-pham','/admin/don-hang','/admin/banh-dat-rieng','/admin/cai-dat','/admin/giao-dien']){
  const before=runtimeErrors;
  const response=await page.goto(origin+path);
  result.admin.push({path,status:response.status(),runtimeErrors:runtimeErrors-before});
  assert.equal(response.status(),200,'Admin read page failed');
}
const logout=await context.request.post(origin+'/api/admin/logout');
result.security.logout=logout.status();
assert.equal((await context.request.get(origin+'/api/admin/orders/export')).status(),401,'Logout did not remove browser authorization');
result.runtimeErrors=runtimeErrors;
await writeFile('.playwright-mcp/handoff/browser-smoke-final.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
await browser.close();
