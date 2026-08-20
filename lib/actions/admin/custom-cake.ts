"use server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { updateBakeryRow, createBakeryRow } from "@/lib/bakery/mutations";
import { getAdminCustomCake } from "@/lib/bakery/admin/custom-cake";
import { getSiteSettings } from "@/lib/bakery/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { orderDataSchema, orderAddressSchema } from "@/lib/bakery/schemas";
import { sendEmail } from "@/lib/email/client";
import { customCakeQuoteEmail } from "@/lib/email/templates";
import type { AdminActionResult } from "./types";

export async function quoteCustomCake(id: number, quotedPrice: number, adminReply: string): Promise<AdminActionResult> {
  await requireAdmin();
  const cake = await getAdminCustomCake(id);
  if (!cake) return { ok: false, error: "not_found" };

  await updateBakeryRow(id, "custom_cake", {
    status: "quoted",
    data: { ...cake.data, quoted_price: quotedPrice, admin_reply: adminReply },
  });

  if (cake.data.email) {
    const settings = await getSiteSettings();
    const brandName = settings?.data.brand_name.vi ?? "Tiệm bánh";
    await sendEmail({
      to: cake.data.email,
      subject: `Báo giá bánh theo yêu cầu — ${brandName}`,
      html: customCakeQuoteEmail({ brandName, quotedPrice, adminReply }),
    }).catch((err) => console.error("[admin/custom-cake] gui email bao gia that bai:", err));
  }

  return { ok: true, id };
}

export async function convertCustomCakeToOrder(
  id: number,
  input: {
    address: { line: string; ward?: string; district?: string; city: string };
    paymentMethod: "cod" | "bank_transfer";
  },
): Promise<AdminActionResult> {
  await requireAdmin();
  const cake = await getAdminCustomCake(id);
  if (!cake) return { ok: false, error: "not_found" };
  if (cake.data.quoted_price === null || cake.data.quoted_price === undefined) {
    return { ok: false, error: "not_quoted" };
  }

  const address = orderAddressSchema.parse(input.address);
  const settings = await getSiteSettings();
  const shipping = settings?.data.shipping ?? { fee: 25000, free_from: 500000 };
  const subtotal = cake.data.quoted_price;
  const shippingFee = subtotal >= shipping.free_from ? 0 : shipping.fee;
  const total = subtotal + shippingFee;

  const supabase = createAdminClient();
  const { data: codeResult, error: codeError } = await supabase.rpc("bakery_next_order_code");
  if (codeError || !codeResult) return { ok: false, error: "server_error" };

  const orderData = orderDataSchema.parse({
    code: codeResult,
    customer_name: cake.data.customer_name,
    phone: cake.data.phone,
    email: cake.data.email,
    address,
    delivery_at: cake.data.need_at,
    note: cake.data.note,
    payment_method: input.paymentMethod,
    payment_status: "unpaid",
    subtotal,
    discount: 0,
    shipping_fee: shippingFee,
    total,
    items_snapshot: [
      {
        product_id: 0,
        name: `Bánh theo yêu cầu — ${cake.data.size}, ${cake.data.flavor}`,
        image: cake.data.reference_images[0],
        unit_price: subtotal,
        qty: 1,
        options: {},
        line_total: subtotal,
      },
    ],
    timeline: [{ status: "pending", at: new Date().toISOString(), by: "admin", note: "Chuyển từ yêu cầu đặt bánh riêng" }],
  });

  const order = await createBakeryRow({ type: "order", status: "pending", data: orderData });
  await updateBakeryRow(id, "custom_cake", { status: "accepted", data: cake.data });

  return { ok: true, id: order.id };
}
