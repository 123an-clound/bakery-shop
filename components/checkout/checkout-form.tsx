"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import { checkoutFormSchema, type CheckoutFormValues } from "@/lib/schemas/checkout";
import { calcOrderTotal } from "@/lib/bakery/pricing";
import type { Locale } from "@/lib/bakery/types";
import { useCartStore } from "@/lib/store/cart";
import { formatMoney } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function minDeliveryDateTime(): string {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  d.setSeconds(0, 0);
  return d.toISOString().slice(0, 16);
}

export function CheckoutForm({
  locale,
  shippingFee,
  freeFrom,
}: {
  locale: Locale;
  shippingFee: number;
  freeFrom: number;
}) {
  const t = useTranslations("Checkout");
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const couponCode = useCartStore((s) => s.couponCode);
  const couponDiscount = useCartStore((s) => s.couponDiscount);
  const clearCart = useCartStore((s) => s.clear);

  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
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
      deliveryAt: minDeliveryDateTime(),
      note: "",
      paymentMethod: "cod",
    },
  });

  const paymentMethod = watch("paymentMethod");
  const totals = calcOrderTotal({
    items,
    discount: couponDiscount,
    shipping: { fee: shippingFee, freeFrom },
  });

  async function onSubmit(values: CheckoutFormValues) {
    setSubmitError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, qty: i.qty, options: i.options })),
          customerName: values.customerName,
          phone: values.phone,
          email: values.email,
          address: { line: values.addressLine, ward: values.ward, district: values.district, city: values.city },
          deliveryAt: new Date(values.deliveryAt).toISOString(),
          note: values.note,
          paymentMethod: values.paymentMethod,
          couponCode: couponCode ?? undefined,
        }),
      });

      if (!res.ok) {
        setSubmitError(t("submitError"));
        return;
      }

      const data = (await res.json()) as { code: string };
      clearCart();
      router.push(`/dat-hang-thanh-cong/${data.code}`);
    } catch {
      setSubmitError(t("submitError"));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div>
        <h2 className="font-heading mb-4 text-xl font-semibold">{t("customerInfoTitle")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">{t("fullName")}</label>
            <Input {...register("customerName")} className="rounded-full" />
            {errors.customerName ? <p className="text-destructive mt-1 text-xs">{errors.customerName.message}</p> : null}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t("phone")}</label>
            <Input {...register("phone")} className="rounded-full" />
            {errors.phone ? <p className="text-destructive mt-1 text-xs">{errors.phone.message}</p> : null}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t("email")}</label>
            <Input type="email" {...register("email")} className="rounded-full" />
            {errors.email ? <p className="text-destructive mt-1 text-xs">{errors.email.message}</p> : null}
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-heading mb-4 text-xl font-semibold">{t("addressTitle")}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <label className="mb-1 block text-sm font-medium">{t("addressLine")}</label>
            <Input {...register("addressLine")} className="rounded-full" />
            {errors.addressLine ? <p className="text-destructive mt-1 text-xs">{errors.addressLine.message}</p> : null}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t("ward")}</label>
            <Input {...register("ward")} className="rounded-full" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t("district")}</label>
            <Input {...register("district")} className="rounded-full" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t("city")}</label>
            <Input {...register("city")} className="rounded-full" />
            {errors.city ? <p className="text-destructive mt-1 text-xs">{errors.city.message}</p> : null}
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">{t("deliveryAt")}</label>
            <Input type="datetime-local" {...register("deliveryAt")} className="rounded-full" />
            {errors.deliveryAt ? <p className="text-destructive mt-1 text-xs">{errors.deliveryAt.message}</p> : null}
          </div>
          <div className="sm:col-span-3">
            <label className="mb-1 block text-sm font-medium">{t("note")}</label>
            <textarea
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
            <input type="radio" value="bank_transfer" {...register("paymentMethod")} />
            <span>{t("paymentBankTransfer")}</span>
          </label>
        </div>
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
          <span className="text-primary">{formatMoney(totals.total, locale)}</span>
        </div>
      </div>

      {submitError ? <p className="text-destructive text-sm">{submitError}</p> : null}

      <Button type="submit" size="lg" className="w-full rounded-full" disabled={isSubmitting || items.length === 0}>
        {isSubmitting ? "..." : t("placeOrder")}
      </Button>
    </form>
  );
}
