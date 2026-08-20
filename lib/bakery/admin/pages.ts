import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { pageDataSchema, type PageData } from "@/lib/bakery/schemas";

export interface AdminPageRow {
  id: number;
  slug: string;
  data: PageData;
}

/** The 4 fixed static pages (mục 9.8) — trang giới thiệu, chính sách giao hàng, điều khoản, liên hệ. */
export const STATIC_PAGE_SLUGS = ["gioi-thieu", "chinh-sach-giao-hang", "dieu-khoan"] as const;

export async function getAdminPageBySlug(slug: string): Promise<AdminPageRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("bakery").select("id, slug, data").eq("type", "page").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data && data.slug ? { id: data.id, slug: data.slug, data: pageDataSchema.parse(data.data) } : null;
}
