import "server-only";

import type { User } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { createBakeryRow } from "./mutations";

/** Call only with a user verified by Supabase Auth, never a submitted user ID. */
export async function ensureCustomerProfile(user: User): Promise<void> {
  try {
    const { data, error } = await createAdminClient()
      .from("bakery")
      .select("id")
      .eq("type", "customer")
      .eq("data->>user_id", user.id)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (data) return;

    const fullName = user.user_metadata.full_name;
    await createBakeryRow({
      type: "customer",
      data: {
        user_id: user.id,
        ...(typeof fullName === "string" ? { full_name: fullName } : {}),
      },
    });
  } catch {
    // Profile creation must not prevent a successfully authenticated user
    // from reaching their account. Do not log account details or tokens.
    console.error("[auth] customer_profile_failed");
  }
}
