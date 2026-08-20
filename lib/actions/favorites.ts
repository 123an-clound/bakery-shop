"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createBakeryRow } from "@/lib/bakery/mutations";

export interface ToggleFavoriteResult {
  ok: boolean;
  favorited: boolean;
  message?: string;
}

/**
 * `favorite` rows have no write policy for authenticated users (muc 4/6.3 —
 * no INSERT/UPDATE/DELETE policies at all on `bakery`), so the actual write
 * goes through the service-role client — but only after independently
 * confirming who the caller is via `auth.getUser()` on the cookie-aware
 * client. The client-submitted `productId` is never trusted as "this user's
 * favorite"; the row we write always uses the server-verified user id.
 */
export async function toggleFavorite(productId: number): Promise<ToggleFavoriteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, favorited: false, message: "sign_in_required" };
  }

  const admin = createAdminClient();
  const { data: existing, error: findError } = await admin
    .from("bakery")
    .select("id")
    .eq("type", "favorite")
    .eq("parent_id", productId)
    .eq("data->>user_id", user.id)
    .maybeSingle();
  if (findError) {
    return { ok: false, favorited: false, message: "server_error" };
  }

  if (existing) {
    const { error } = await admin.from("bakery").delete().eq("id", existing.id);
    if (error) return { ok: false, favorited: true, message: "server_error" };
    revalidatePath("/tai-khoan/yeu-thich");
    return { ok: true, favorited: false };
  }

  await createBakeryRow({ type: "favorite", parentId: productId, data: { user_id: user.id } });
  revalidatePath("/tai-khoan/yeu-thich");
  return { ok: true, favorited: true };
}
