import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { productDataSchema } from "./schemas";

/** IDs of products the signed-in user favorited — RLS-scoped (own rows only). */
export async function getMyFavoriteProductIds(): Promise<number[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase.from("bakery").select("parent_id").eq("type", "favorite");
  if (error) throw error;
  return (data ?? []).map((r) => r.parent_id).filter((id): id is number => id !== null);
}

export interface FavoriteProduct {
  id: number;
  slug: string;
  data: ReturnType<typeof productDataSchema.parse>;
}

/**
 * Favorited products with their current product data. Product rows
 * themselves are public content (RLS `bakery_select` already allows anon
 * read for active products), so this step uses the admin client purely to
 * batch-fetch by id — the favorite-ownership check already happened via
 * `getMyFavoriteProductIds`.
 */
export async function getMyFavoriteProducts(): Promise<FavoriteProduct[]> {
  const ids = await getMyFavoriteProductIds();
  if (ids.length === 0) return [];

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("bakery")
    .select("id, slug, data")
    .eq("type", "product")
    .eq("status", "active")
    .in("id", ids);
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug ?? "",
    data: productDataSchema.parse(row.data),
  }));
}
