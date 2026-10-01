import { expect, it, vi } from "vitest";
vi.mock("@/lib/bakery/queries", () => ({ getSiteSettings: async () => ({data:{seo:{description:{vi:"QA Vietnamese",en:"QA English"},og_image:"https://example.test/qa.jpg"}}}) }));
vi.mock("next-intl/server", () => ({getTranslations:async()=>()=>"Fallback"}));
import { buildMetadata } from "@/lib/seo/metadata";
it("retains configured descriptions and sharing images on catalog pages",async()=>{
  const metadata=await buildMetadata({title:"QA",path:"/san-pham",locale:"en",searchParams:{page:"2"}});
  expect(metadata.description).toBe("QA English");
  expect(metadata.openGraph?.images).toEqual([{url:"https://example.test/qa.jpg"}]);
  expect(metadata.alternates?.canonical).toBe("/en/san-pham?page=2");
});
it("preserves product-specific content and excludes search/private pages from indexing",async()=>{
  const metadata=await buildMetadata({title:"QA",description:"Specific",ogImage:"https://example.test/product.jpg",path:"/san-pham",locale:"vi",searchParams:{q:"QA"}});
  expect(metadata.description).toBe("Specific");
  expect(metadata.robots).toEqual({index:false,follow:true});
  expect((await buildMetadata({title:"QA",path:"/thanh-toan",locale:"vi"})).robots).toEqual({index:false,follow:false});
});
