"use client";

import { useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import { checkoutFormSchema, type CheckoutFormValues } from "@/lib/schemas/checkout";
import { calcOrderTotal } from "@/lib/bakery/pricing";
import type { Locale } from "@/lib/bakery/types";
import { useCartStore } from "@/lib/store/cart";
import { formatMoney } from "@/lib/utils/format";
import { toShopDatetimeValue, shopDatetimeToIso } from "@/lib/utils/datetime-local";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function minDeliveryDateTime(prepHours: number): string {
  return toShopDatetimeValue(new Date(Date.now() + prepHours * 60 * 60 * 1000 + 5 * 60 * 1000));
}

export function CheckoutForm({
  locale,
  shippingFee,
  freeFrom,
  bankTransferEnabled,
}: {
  locale: Locale;
  shippingFee: number;
  freeFrom: number;
  bankTransferEnabled: boolean;
}) {
  const t = useTranslations("Checkout");
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const couponCode = useCartStore((s) => s.couponCode);
  const couponDiscount = useCartStore((s) => s.couponDiscount);
  const clearCart = useCartStore((s) => s.clear);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const submission = useRef<{ fingerprint: string; requestId: string } | null>(null);
  const submitting = useRef(false);
  const [shipping, setShipping] = useState({ fee: shippingFee, freeFrom });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      customerName: "",
      phone: "",
      email: "",
      addressLine: "",
      ward: "",
      district: "",
      city: "",
      deliveryAt: minDeliveryDateTime(Math.max(0, ...items.map(item => item.prepTimeHours ?? 24))),
      note: "",
      paymentMethod: "cod",
    },
  });

  const paymentMethod = useWatch({ control, name: "paymentMethod" });
  const totals = calcOrderTotal({
    items,
    discount: couponDiscount,
    shipping,
  });

  async function onSubmit(values: CheckoutFormValues) {
    if (submitting.current) return;
    submitting.current = true;
    setSubmitError(null);
    try {
      const payload = {
          items: items.map((i) => ({ productId: i.productId, qty: i.qty, options: i.options })),
          customerName: values.customerName,
          phone: values.phone,
          email: values.email,
          address: { line: values.addressLine, ward: values.ward, district: values.district, city: values.city },
          deliveryAt: shopDatetimeToIso(values.deliveryAt),
          note: values.note,
          paymentMethod: values.paymentMethod,
          couponCode: couponCode ?? undefined,
          expectedTotal: totals.total,
      };
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(payload)));
      const fingerprint = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
      // Store only a digest and random retry key, never customer form values.
      try { submission.current ??= JSON.parse(sessionStorage.getItem("bakery-checkout-retry") ?? "null"); } catch { /* storage may be disabled */ }
      if (submission.current?.fingerprint !== fingerprint) submission.current = { fingerprint, requestId: crypto.randomUUID() };
      try { sessionStorage.setItem("bakery-checkout-retry", JSON.stringify(submission.current)); } catch { /* in-memory retry still works */ }
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, requestId: submission.current.requestId }),
      });

      if (!res.ok) {
        const failure = await res.json().catch(() => ({}));
        if (failure.error === "price_changed" && Array.isArray(failure.prices)) {
          useCartStore.getState().updatePrices(failure.prices);
          useCartStore.getState().setCoupon(couponCode, failure.discount);
          setShipping({ fee: failure.shippingFee, freeFrom: failure.freeFrom });
        }
        const known = ["price_changed", "coupon_invalid", "out_of_stock", "invalid_option", "product_not_found", "delivery_too_soon", "payment_unavailable", "cart_changed", "too_many_requests"];
        setSubmitError(known.includes(failure.error) ? t(`errors.${failure.error}`) : t("submitError"));
        return;
      }

      const data = (await res.json()) as { code: string };
      try { sessionStorage.removeItem("bakery-checkout-retry"); } catch { /* optional storage */ }
      clearCart();
      router.push(`/dat-hang-thanh-cong/${data.code}`);
    } catch {
      setSubmitError(t("submitError"));
    } finally {
      submitting.current = false;
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} className="space-y-8">
      <div>
        <h2 className="font-heading mb-4 text-xl font-semibold">{t("customerInfoTitle")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="checkout-name" className="mb-1 block text-sm font-medium">
              {t("fullName")}
            </label>
            <Input
              id="checkout-name"
              autoComplete="name"
              {...register("customerName")}
              className="rounded-full"
              aria-invalid={!!errors.customerName}
              aria-describedby={errors.customerName ? "checkout-name-error" : undefined}
            />
            {errors.customerName ? (
              <p id="checkout-name-error" className="text-destructive mt-1 text-xs">
                {errors.customerName.message}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="checkout-phone" className="mb-1 block text-sm font-medium">
              {t("phone")}
            </label>
            <Input
              id="checkout-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              {...register("phone")}
              className="rounded-full"
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? "checkout-phone-error" : undefined}
            />
            {errors.phone ? (
              <p id="checkout-phone-error" className="text-destructive mt-1 text-xs">
                {errors.phone.message}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="checkout-email" className="mb-1 block text-sm font-medium">
              {t("email")}
            </label>
            <Input
              id="checkout-email"
              autoComplete="email"
              type="email"
              {...register("email")}
              className="rounded-full"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "checkout-email-error" : undefined}
            />
            {errors.email ? (
              <p id="checkout-email-error" className="text-destructive mt-1 text-xs">
                {errors.email.message}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-heading mb-4 text-xl font-semibold">{t("addressTitle")}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <label htmlFor="checkout-address-line" className="mb-1 block text-sm font-medium">
              {t("addressLine")}
            </label>
            <Input
              id="checkout-address-line"
              autoComplete="street-address"
              {...register("addressLine")}
              className="rounded-full"
              aria-invalid={!!errors.addressLine}
              aria-describedby={errors.addressLine ? "checkout-address-line-error" : undefined}
            />
            {errors.addressLine ? (
              <p id="checkout-address-line-error" className="text-destructive mt-1 text-xs">
                {errors.addressLine.message}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="checkout-ward" className="mb-1 block text-sm font-medium">
              {t("ward")}
            </label>
            <Input id="checkout-ward" {...register("ward")} className="rounded-full" />
          </div>
          <div>
            <label htmlFor="checkout-district" className="mb-1 block text-sm font-medium">
              {t("district")}
            </label>
            <Input id="checkout-district" {...register("district")} className="rounded-full" />
          </div>
          <div>
            <label htmlFor="checkout-city" className="mb-1 block text-sm font-medium">
              {t("city")}
            </label>
            <Input
              id="checkout-city"
              autoComplete="address-level1"
              {...register("city")}
              className="rounded-full"
              aria-invalid={!!errors.city}
              aria-describedby={errors.city ? "checkout-city-error" : undefined}
            />
            {errors.city ? (
              <p id="checkout-city-error" className="text-destructive mt-1 text-xs">
                {errors.city.message}
              </p>
            ) : null}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="checkout-delivery-at" className="mb-1 block text-sm font-medium">
              {t("deliveryAt")}
            </label>
            <Input
              id="checkout-delivery-at"
              type="datetime-local"
              {...register("deliveryAt")}
              className="rounded-full"
              aria-invalid={!!errors.deliveryAt}
              aria-describedby={errors.deliveryAt ? "checkout-delivery-at-error" : undefined}
            />
            {errors.deliveryAt ? (
              <p id="checkout-delivery-at-error" className="text-destructive mt-1 text-xs">
                {errors.deliveryAt.message}
              </p>
            ) : null}
          </div>
          <div className="sm:col-span-3">
            <label htmlFor="checkout-note" className="mb-1 block text-sm font-medium">
              {t("note")}
            </label>
            <textarea
              id="checkout-note"
              {...register("note")}
              rows={2}
              className="border-input w-full rounded-2xl border p-3 text-sm"
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-heading mb-4 text-xl font-semibold">{t("paymentTitle")}</h2>
        <div className="space-y-2">
          <label className="border-input has-checked:border-primary has-checked:bg-primary/10 flex items-center gap-3 rounded-2xl border p-4">
            <input type="radio" value="cod" {...register("paymentMethod")} />
            <span>{t("paymentCod")}</span>
          </label>
          <label className="border-input has-checked:border-primary has-checked:bg-primary/10 flex items-center gap-3 rounded-2xl border p-4">
            <input type="radio" value="bank_transfer" disabled={!bankTransferEnabled} {...register("paymentMethod")} />
            <span>{t("paymentBankTransfer")}</span>
          </label>
        </div>
        {!bankTransferEnabled ? <p className="text-muted-foreground mt-2 text-xs">{t("errors.payment_unavailable")}</p> : null}
        {paymentMethod === "bank_transfer" ? (
          <p className="text-muted-foreground mt-2 text-xs">{t("bankTransferNote")}</p>
        ) : null}
      </div>

      <div className="bg-secondary/30 space-y-1.5 rounded-3xl p-5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("subtotal")}</span>
          <span>{formatMoney(totals.subtotal, locale)}</span>
        </div>
        {totals.discount > 0 ? (
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("discount")}</span>
            <span>-{formatMoney(totals.discount, locale)}</span>
          </div>
        ) : null}
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("shipping")}</span>
          <span>{formatMoney(totals.shippingFee, locale)}</span>
        </div>
        <div className="border-border flex justify-between border-t pt-2 text-base font-semibold">
          <span>{t("total")}</span>
          <span className="text-brand-accent">{formatMoney(totals.total, locale)}</span>
        </div>
      </div>

      {submitError ? <p role="alert" className="text-destructive text-sm">{submitError}</p> : null}

      <Button type="submit" size="lg" className="w-full rounded-full" disabled={isSubmitting || items.length === 0}>
        {isSubmitting ? "..." : t("placeOrder")}
      </Button>
    </form>
  );
}
