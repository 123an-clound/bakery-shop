import { createHash } from "node:crypto";
import { NextResponse, after } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { orderInputSchema } from "@/lib/schemas/order-input";
import { getActiveCouponByCode } from "@/lib/bakery/catalog";
import { getPrivateNotifyEmails } from "@/lib/bakery/settings-private";
import { orderDataSchema, settingSiteDataSchema } from "@/lib/bakery/schemas";
import { calcOrderTotal, validateCoupon } from "@/lib/bakery/pricing";
import { CheckoutError, priceOrderItems } from "@/lib/bakery/order-pricing";
import { sendEmail } from "@/lib/email/client";
import { newOrderNotificationEmail, orderConfirmationEmail } from "@/lib/email/templates";
import { consumeRateLimit, requestClientKey } from "@/lib/security/rate-limit";
import { ORDER_ACCESS_MAX_AGE, orderAccessCookie, signOrderAccess } from "@/lib/auth/order-access";
import { readLimitedBody } from "@/lib/security/request-body";

const committedSchema = z.object({ code: z.string(), total: z.number(), created: z.boolean() });

function receiptResponse(code: string, total: number, created: boolean) {
  const response = NextResponse.json({ code, total }, { status: created ? 201 : 200, headers: { "Cache-Control": "private, no-store" } });
  response.cookies.set(orderAccessCookie(code), signOrderAccess(code), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: ORDER_ACCESS_MAX_AGE,
  });
  return response;
}

/** Validate/reprice on the server, then atomically commit the verified snapshot. */
export async function POST(request: Request) {
  const rate = consumeRateLimit("orders:" + requestClientKey(request), 10, 15 * 60 * 1000);
  if (!rate.allowed) return NextResponse.json({ error: "too_many_requests" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  if (!request.headers.get("content-type")?.includes("application/json")) return NextResponse.json({ error: "invalid_input" }, { status: 415 });
  let text: string;
  try { text = new TextDecoder().decode(await readLimitedBody(request, 64_000)); }
  catch { return NextResponse.json({ error: "invalid_input" }, { status: 413 }); }
  const parsed = orderInputSchema.safeParse(await Promise.resolve().then(() => JSON.parse(text)).catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  const input = parsed.data;
  try {
    signOrderAccess("configuration-check");
    const sessionClient = await createClient();
    const { data: { user } } = await sessionClient.auth.getUser();
    const supabase = createAdminClient();
    const requestHash = createHash("sha256").update(JSON.stringify({ ...input, userId: user?.id ?? null })).digest("hex");
    const { data: existing, error: existingError } = await supabase.from("bakery").select("data")
      .eq("type", "order").eq("slug", "checkout-" + input.requestId).maybeSingle();
    if (existingError) throw existingError;
    if (existing) {
      const order = orderDataSchema.parse(existing.data);
      if (order.request_hash !== requestHash) throw new CheckoutError("idempotency_conflict");
      return receiptResponse(order.code, order.total, false);
    }
    const [{ data: products, error: productsError }, { data: setting, error: settingError }, coupon] = await Promise.all([
      supabase.from("bakery").select("id,data").eq("type", "product").eq("status", "active").in("id", [...new Set(input.items.map(i => i.productId))]),
      supabase.from("bakery").select("data").eq("type", "setting").eq("slug", "site").eq("status", "active").maybeSingle(),
      input.couponCode ? getActiveCouponByCode(input.couponCode) : Promise.resolve(null),
    ]);
    if (productsError || settingError || !setting) throw new Error("checkout_configuration_unavailable");
    const settings = settingSiteDataSchema.parse(setting.data);
    const items = priceOrderItems(input, products ?? []);
    const subtotal = items.reduce((sum, item) => sum + item.line_total, 0);
    let discount = 0;
    if (input.couponCode) {
      if (!coupon) throw new CheckoutError("coupon_invalid");
      const validation = validateCoupon(coupon.data, subtotal);
      if (!validation.valid) throw new CheckoutError("coupon_invalid");
      discount = validation.discount;
    }
    if (input.paymentMethod === "bank_transfer" && (!settings.bank?.bank_code || !settings.bank.account_number || !settings.bank.account_name)) {
      throw new CheckoutError("payment_unavailable");
    }
    const shipping = settings.shipping ?? { fee: 25000, free_from: 500000 };
    const totals = calcOrderTotal({ items: items.map(item => ({ unitPrice: item.unit_price, qty: item.qty })), discount, shipping: { fee: shipping.fee, freeFrom: shipping.free_from } });
    if (!Number.isSafeInteger(totals.total)) throw new CheckoutError("invalid_price");
    if (totals.total !== input.expectedTotal) {
      return NextResponse.json({ error: "price_changed", total: totals.total, discount: totals.discount, shippingFee: shipping.fee, freeFrom: shipping.free_from, prices: items.map(item => ({ productId: item.product_id, options: item.options, unitPrice: item.unit_price })) }, { status: 409 });
    }
    const order = orderDataSchema.parse({
      code: "pending", user_id: user?.id, customer_name: input.customerName, phone: input.phone,
      email: input.email || undefined, address: input.address, delivery_at: input.deliveryAt, note: input.note,
      payment_method: input.paymentMethod, payment_status: "unpaid", coupon_code: coupon?.data.code,
      subtotal: totals.subtotal, discount: totals.discount, shipping_fee: totals.shippingFee, total: totals.total,
      items_snapshot: items, timeline: [{ status: "pending", at: new Date().toISOString(), by: "system", note: "" }],
    });
    const { data, error } = await supabase.rpc("bakery_commit_order", {
      p_request_id: input.requestId, p_request_hash: requestHash,
      p_order: order as unknown as Json, p_products: products as Json,
      p_coupon: coupon ? { id: coupon.id, data: coupon.data as unknown as Json } : null,
      p_setting: setting.data,
    });
    if (error) {
      if (["cart_changed", "out_of_stock", "coupon_invalid", "idempotency_conflict"].includes(error.message)) throw new CheckoutError(error.message);
      throw new Error("order_commit_failed");
    }
    const committed = committedSchema.parse(data);
    if (committed.created) {
      revalidateTag("products", { expire: 0 });
      // An email failure must never turn a committed order into a failed checkout.
      after(async () => {
        try {
          const notifyEmails = await getPrivateNotifyEmails();
          await Promise.all([
            input.email ? sendEmail({ to: input.email, subject: "Xác nhận đơn hàng " + committed.code, html: orderConfirmationEmail({ brandName: settings.brand_name.vi, code: committed.code, items: items.map(i => ({ name: i.name, qty: i.qty, lineTotal: i.line_total })), total: totals.total, paymentMethod: input.paymentMethod, deliveryAt: input.deliveryAt }) }) : Promise.resolve(),
            notifyEmails.length ? sendEmail({ to: notifyEmails, subject: "[Đơn mới] " + committed.code, html: newOrderNotificationEmail({ code: committed.code, customerName: input.customerName, phone: input.phone, total: totals.total, paymentMethod: input.paymentMethod }) }) : Promise.resolve(),
          ]);
        } catch { console.error("[orders] notification_failed"); }
      });
    }
    return receiptResponse(committed.code, committed.total, committed.created);
  } catch (error) {
    if (error instanceof CheckoutError) return NextResponse.json({ error: error.code }, { status: 409 });
    console.error("[orders] checkout_failed");
    return NextResponse.json({ error: "server_error" }, { status: 503 });
  }
}
