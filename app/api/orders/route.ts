import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getActiveCouponByCode } from "@/lib/bakery/catalog";
import { getSiteSettings } from "@/lib/bakery/queries";
import { getPrivateNotifyEmails } from "@/lib/bakery/settings-private";
import { createBakeryRow, updateBakeryRow } from "@/lib/bakery/mutations";
import { orderDataSchema, productDataSchema } from "@/lib/bakery/schemas";
import { calcOrderTotal, validateCoupon } from "@/lib/bakery/pricing";
import { sendEmail } from "@/lib/email/client";
import { newOrderNotificationEmail, orderConfirmationEmail } from "@/lib/email/templates";

const orderInputSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        qty: z.number().int().positive().max(50),
        options: z.record(z.string(), z.string()).default({}),
      }),
    )
    .min(1)
    .max(50),
  customerName: z.string().trim().min(1).max(120),
  phone: z.string().regex(/^0\d{9}$/, "So dien thoai khong hop le"),
  email: z.email().optional().or(z.literal("")),
  address: z.object({
    line: z.string().trim().min(1),
    ward: z.string().trim().optional(),
    district: z.string().trim().optional(),
    city: z.string().trim().min(1),
  }),
  deliveryAt: z.string().min(1),
  note: z.string().max(500).optional(),
  paymentMethod: z.enum(["cod", "bank_transfer"]),
  couponCode: z.string().trim().optional(),
});

/**
 * Tao don hang. Gia luon duoc tinh lai hoan toan tu du lieu server — muc
 * 6.3 checklist: "Gia tien tinh lai hoan toan o server khi tao don. Khong
 * bao gio tin `total` do client gui len." Payload client gui KHONG chua
 * bat ky truong gia nao ca (chi productId/qty/options) de khong the co
 * "total gia" bi bo qua — khong co gi de bo qua.
 */
export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = orderInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  // Attach the signed-in customer's user_id when a session cookie is
  // present so `/tai-khoan` order history (RLS-scoped) picks it up; guest
  // checkout (no session) leaves user_id undefined and still works.
  const sessionClient = await createClient();
  const {
    data: { user: sessionUser },
  } = await sessionClient.auth.getUser();

  const supabase = createAdminClient();

  // 1) Load every referenced product fresh from the DB — never trust a
  // client-supplied price/name.
  const productIds = [...new Set(input.items.map((i) => i.productId))];
  const { data: productRows, error: productsError } = await supabase
    .from("bakery")
    .select("*")
    .eq("type", "product")
    .eq("status", "active")
    .in("id", productIds);
  if (productsError) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
  const productMap = new Map(productRows.map((r) => [r.id, r]));

  const itemsSnapshot: Array<{
    product_id: number;
    name: string;
    image?: string;
    unit_price: number;
    qty: number;
    options: Record<string, string>;
    line_total: number;
  }> = [];

  for (const line of input.items) {
    const row = productMap.get(line.productId);
    if (!row) {
      return NextResponse.json({ error: "product_not_found", productId: line.productId }, { status: 400 });
    }
    const product = productDataSchema.parse(row.data);

    if (product.stock !== null && product.stock !== undefined && product.stock < line.qty) {
      return NextResponse.json({ error: "out_of_stock", productId: line.productId }, { status: 409 });
    }

    // Validate every selected option value actually exists on this product
    // — a client can't invent an option key/value to manufacture a price_delta.
    let optionsDelta = 0;
    for (const [optionKey, choiceValue] of Object.entries(line.options)) {
      const option = product.options.find((o) => o.key === optionKey);
      const choice = option?.choices.find((c) => c.value === choiceValue);
      if (!option || !choice) {
        return NextResponse.json(
          { error: "invalid_option", productId: line.productId, option: optionKey },
          { status: 400 },
        );
      }
      optionsDelta += choice.price_delta;
    }

    const unitPrice = (product.sale_price ?? product.price) + optionsDelta;
    const lineTotal = unitPrice * line.qty;

    itemsSnapshot.push({
      product_id: line.productId,
      name: product.name.vi,
      image: product.images[0],
      unit_price: unitPrice,
      qty: line.qty,
      options: line.options,
      line_total: lineTotal,
    });
  }

  // 2) Coupon (re-validated server-side; usage is only committed after the
  // order insert below succeeds).
  const subtotal = itemsSnapshot.reduce((sum, i) => sum + i.line_total, 0);
  let discount = 0;
  let couponRow: Awaited<ReturnType<typeof getActiveCouponByCode>> = null;
  if (input.couponCode) {
    couponRow = await getActiveCouponByCode(input.couponCode);
    if (couponRow) {
      const result = validateCoupon(couponRow.data, subtotal);
      if (result.valid) {
        discount = result.discount;
      }
      // An invalid coupon at this final step silently contributes no
      // discount rather than failing the whole order — the cart page
      // already validated it once; a race (e.g. limit hit meanwhile) is
      // rare and shouldn't block checkout.
    }
  }

  // 3) Shipping from live settings, never from the client.
  const settingsRow = await getSiteSettings();
  const shipping = settingsRow?.data.shipping ?? { fee: 25000, free_from: 500000 };
  const totals = calcOrderTotal({
    items: itemsSnapshot.map((i) => ({ unitPrice: i.unit_price, qty: i.qty })),
    discount,
    shipping: { fee: shipping.fee, freeFrom: shipping.free_from },
  });

  // 4) Order code via the DB-side generator (guarantees uniqueness under concurrency).
  const { data: codeResult, error: codeError } = await supabase.rpc("bakery_next_order_code");
  if (codeError || !codeResult) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
  const code = codeResult;

  const orderData = orderDataSchema.parse({
    code,
    user_id: sessionUser?.id,
    customer_name: input.customerName,
    phone: input.phone,
    email: input.email || undefined,
    address: input.address,
    delivery_at: input.deliveryAt,
    note: input.note,
    payment_method: input.paymentMethod,
    payment_status: "unpaid",
    coupon_code: discount > 0 ? input.couponCode : undefined,
    subtotal: totals.subtotal,
    discount: totals.discount,
    shipping_fee: totals.shippingFee,
    total: totals.total,
    items_snapshot: itemsSnapshot,
    timeline: [{ status: "pending", at: new Date().toISOString(), by: "system", note: "" }],
  });

  const order = await createBakeryRow({ type: "order", status: "pending", data: orderData });

  // order_item rows — kept for SQL reporting (top sellers etc.); items_snapshot
  // on the order itself remains the source of truth for the order's contents.
  await Promise.all(
    itemsSnapshot.map((item) =>
      createBakeryRow({
        type: "order_item",
        parentId: order.id,
        data: {
          product_id: item.product_id,
          name: item.name,
          qty: item.qty,
          unit_price: item.unit_price,
          options: item.options,
          line_total: item.line_total,
        },
      }),
    ),
  );

  if (discount > 0 && couponRow) {
    await updateBakeryRow(couponRow.id, "coupon", {
      data: { ...couponRow.data, used_count: couponRow.data.used_count + 1 },
    }).catch((err) => console.error("[orders] khong the cap nhat used_count cua coupon:", err));
  }

  const brandName = settingsRow?.data.brand_name.vi ?? "Tiệm bánh";
  const notifyEmails = await getPrivateNotifyEmails();

  await Promise.all([
    input.email
      ? sendEmail({
          to: input.email,
          subject: `Xác nhận đơn hàng ${code}`,
          html: orderConfirmationEmail({
            brandName,
            code,
            items: itemsSnapshot.map((i) => ({ name: i.name, qty: i.qty, lineTotal: i.line_total })),
            total: totals.total,
            paymentMethod: input.paymentMethod,
            deliveryAt: input.deliveryAt,
          }),
        })
      : Promise.resolve(),
    notifyEmails.length > 0
      ? sendEmail({
          to: notifyEmails,
          subject: `[Đơn mới] ${code}`,
          html: newOrderNotificationEmail({
            code,
            customerName: input.customerName,
            phone: input.phone,
            total: totals.total,
            paymentMethod: input.paymentMethod,
          }),
        })
      : Promise.resolve(),
  ]);

  return NextResponse.json({ code, total: totals.total }, { status: 201 });
}
