"use server";

import { updateBakeryRow } from "@/lib/bakery/mutations";
import { getAdminOrder } from "@/lib/bakery/admin/orders";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getSiteSettings } from "@/lib/bakery/queries";
import { sendEmail } from "@/lib/email/client";
import { orderStatusUpdateEmail } from "@/lib/email/templates";
import type { AdminActionResult } from "./types";

export async function updateOrderStatus(id: number, status: string, note?: string): Promise<AdminActionResult> {
  await requireAdmin();
  const order = await getAdminOrder(id);
  if (!order) return { ok: false, error: "not_found" };

  const timeline = [
    ...order.data.timeline,
    { status, at: new Date().toISOString(), by: "admin", note: note ?? "" },
  ];

  await updateBakeryRow(id, "order", { status, data: { ...order.data, timeline } });

  if (order.data.email) {
    const settings = await getSiteSettings();
    const brandName = settings?.data.brand_name.vi ?? "Tiệm bánh";
    await sendEmail({
      to: order.data.email,
      subject: `Cập nhật đơn hàng ${order.data.code}`,
      html: orderStatusUpdateEmail({ brandName, code: order.data.code, status, note }),
    }).catch((err) => console.error("[admin/orders] gui email cap nhat trang thai that bai:", err));
  }

  return { ok: true, id };
}

export async function markOrderPaid(id: number): Promise<AdminActionResult> {
  await requireAdmin();
  const order = await getAdminOrder(id);
  if (!order) return { ok: false, error: "not_found" };
  await updateBakeryRow(id, "order", { data: { ...order.data, payment_status: "paid" } });
  return { ok: true, id };
}

export async function updateOrderInternalNote(id: number, note: string): Promise<AdminActionResult> {
  await requireAdmin();
  const order = await getAdminOrder(id);
  if (!order) return { ok: false, error: "not_found" };
  await updateBakeryRow(id, "order", { data: { ...order.data, internal_note: note } });
  return { ok: true, id };
}
