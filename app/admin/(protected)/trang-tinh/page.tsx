import type { Metadata } from "next";

import { getAdminPageBySlug, STATIC_PAGE_SLUGS } from "@/lib/bakery/admin/pages";
import { StaticPageEditor } from "@/components/admin/posts/static-page-editor";

export const metadata: Metadata = { title: "Trang tĩnh" };

export default async function AdminStaticPagesPage() {
  const pages = await Promise.all(
    STATIC_PAGE_SLUGS.map(async (slug) => ({ slug, data: (await getAdminPageBySlug(slug))?.data ?? null })),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Trang tĩnh</h1>
      <StaticPageEditor pages={pages} />
    </div>
  );
}
