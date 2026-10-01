"use server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { z } from "zod";
import { getAdminCustomCake } from "@/lib/bakery/admin/custom-cake";
import { getSiteSettings } from "@/lib/bakery/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  customCakeDataSchema,
  orderDataSchema,
  orderAddressSchema,
  settingSiteDataSchema,
} from "@/lib/bakery/schemas";
import type { Json } from "@/lib/supabase/database.types";
import { sendEmail } from "@/lib/email/client";
import { customCakeQuoteEmail } from "@/lib/email/templates";
import type { AdminActionResult } from "./types";

export async function quoteCustomCake(
  id: number,
  quotedPrice: number,
  adminReply: string,
): Promise<AdminActionResult> {
  await requireAdmin();
  if (
    !Number.isSafeInteger(id) ||
    id <= 0 ||
    !Number.isSafeInteger(quotedPrice) ||
    quotedPrice < 0 ||
    typeof adminReply !== "string" ||
    adminReply.length > 2000
  )
    return { ok: false, error: "invalid_input" };
  const cake = await getAdminCustomCake(id);
  if (!cake) return { ok: false, error: "not_found" };

  const { error } = await createAdminClient().rpc("bakery_quote_custom_cake", {
    p_id: id,
    p_price: quotedPrice,
    p_reply: adminReply,
  });
  if (error) return { ok: false, error: "update_failed" };

  if (cake.data.email) {
    const settings = await getSiteSettings();
    const brandName = settings?.data.brand_name.vi ?? "Tiệm bánh";
    const delivery = await sendEmail({
      to: cake.data.email,
      subject: `Báo giá bánh theo yêu cầu — ${brandName}`,
      html: customCakeQuoteEmail({ brandName, quotedPrice, adminReply }),
    });
    if (!delivery.sent) return { ok: true, id, error: "email_not_sent" };
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
  const parsedInput = z
    .object({ address: orderAddressSchema, paymentMethod: z.enum(["cod", "bank_transfer"]) })
    .safeParse(input);
  if (!Number.isSafeInteger(id) || id <= 0 || !parsedInput.success)
    return { ok: false, error: "invalid_input" };
  const supabase = createAdminClient();
  const { data: row, error: readError } = await supabase
    .from("bakery")
    .select("data,status")
    .eq("type", "custom_cake")
    .eq("id", id)
    .maybeSingle();
  if (readError) return { ok: false, error: "server_error" };
  if (!row) return { ok: false, error: "not_found" };
  const cake = { data: customCakeDataSchema.parse(row.data) };
  if (cake.data.order_id) return { ok: true, id: cake.data.order_id };
  if (row.status !== "quoted") return { ok: false, error: "invalid_transition" };
  if (cake.data.quoted_price === null || cake.data.quoted_price === undefined) {
    return { ok: false, error: "not_quoted" };
  }

  const address = parsedInput.data.address;
  const { data: setting, error: settingError } = await supabase
    .from("bakery")
    .select("data")
    .eq("type", "setting")
    .eq("slug", "site")
    .eq("status", "active")
    .maybeSingle();
  if (settingError || !setting) return { ok: false, error: "server_error" };
  const settings = settingSiteDataSchema.parse(setting.data);
  if (
    parsedInput.data.paymentMethod === "bank_transfer" &&
    (!settings.bank?.bank_code || !settings.bank.account_number || !settings.bank.account_name)
  )
    return { ok: false, error: "payment_unavailable" };
  const shipping = settings.shipping ?? { fee: 25000, free_from: 500000 };
  const subtotal = cake.data.quoted_price;
  const shippingFee = subtotal >= shipping.free_from ? 0 : shipping.fee;
  const total = subtotal + shippingFee;

  const orderData = orderDataSchema.parse({
    code: "pending",
    customer_name: cake.data.customer_name,
    phone: cake.data.phone,
    email: cake.data.email,
    address,
    delivery_at: cake.data.need_at,
    note: cake.data.note,
    payment_method: parsedInput.data.paymentMethod,
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
        options: {
          size: cake.data.size,
          layers: String(cake.data.layers),
          sponge: cake.data.sponge,
          cream: cake.data.cream,
          flavor: cake.data.flavor,
          ...(cake.data.message_on_cake ? { message_on_cake: cake.data.message_on_cake } : {}),
          ...(cake.data.color_theme ? { color_theme: cake.data.color_theme } : {}),
        },
        line_total: subtotal,
      },
    ],
    timeline: [
      {
        status: "pending",
        at: new Date().toISOString(),
        by: "admin",
        note: "Chuyển từ yêu cầu đặt bánh riêng",
      },
    ],
  });

  const { data, error } = await supabase.rpc("bakery_convert_custom_cake", {
    p_id: id,
    p_expected: row.data,
    p_order: orderData as unknown as Json,
    p_setting: setting.data,
  });
  if (error) return { ok: false, error: "conversion_failed" };
  const result = z.object({ id: z.number().int().positive() }).safeParse(data);
  return result.success ? { ok: true, id: result.data.id } : { ok: false, error: "server_error" };
}
