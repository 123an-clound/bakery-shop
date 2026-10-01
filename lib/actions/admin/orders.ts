"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { orderDataSchema } from "@/lib/bakery/schemas";
import { z } from "zod";
import { updateTag } from "next/cache";
import { after } from "next/server";
import { ORDER_STATUSES } from "@/lib/bakery/types";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getSiteSettings } from "@/lib/bakery/queries";
import { sendEmail } from "@/lib/email/client";
import { orderStatusUpdateEmail } from "@/lib/email/templates";
import type { AdminActionResult } from "./types";

export async function updateOrderStatus(id: number, status: string, note?: string): Promise<AdminActionResult> {
  await requireAdmin();
  if (!Number.isSafeInteger(id) || id <= 0 || !ORDER_STATUSES.includes(status as typeof ORDER_STATUSES[number]) || (note?.length ?? 0) > 500) return { ok: false, error: "invalid_input" };
  const { data, error } = await createAdminClient().rpc("bakery_update_order", { p_id: id, p_patch: { status, note: note ?? "" } });
  if (error) return { ok: false, error: "update_failed" };
  const result = z.object({ changed: z.boolean(), data: orderDataSchema }).parse(data);
  updateTag("products");
  const order = result;
  if (result.changed && order.data.email) after(async () => {
    try {
    const settings = await getSiteSettings();
    const brandName = settings?.data.brand_name.vi ?? "Tiệm bánh";
    await sendEmail({
      to: order.data.email!,
      subject: `Cập nhật đơn hàng ${order.data.code}`,
      html: orderStatusUpdateEmail({ brandName, code: order.data.code, status, note }),
    });
    } catch { console.error("[admin/orders] notification_failed"); }
  });

  return { ok: true, id };
}

export async function markOrderPaid(id: number): Promise<AdminActionResult> {
  await requireAdmin();
  if (!Number.isSafeInteger(id) || id <= 0) return { ok: false, error: "invalid_input" };
  const { error } = await createAdminClient().rpc("bakery_update_order", { p_id: id, p_patch: { payment_status: "paid" } });
  if (error) return { ok: false, error: "update_failed" };
  return { ok: true, id };
}

export async function updateOrderInternalNote(id: number, note: string): Promise<AdminActionResult> {
  await requireAdmin();
  if (!Number.isSafeInteger(id) || id <= 0 || typeof note !== "string" || note.length > 2000) return { ok: false, error: "invalid_input" };
  const { error } = await createAdminClient().rpc("bakery_update_order", { p_id: id, p_patch: { internal_note: note } });
  if (error) return { ok: false, error: "update_failed" };
  return { ok: true, id };
}
