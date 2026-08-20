"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { applyCoupon } from "@/lib/actions/coupon";
import { calcOrderTotal } from "@/lib/bakery/pricing";
import type { Locale } from "@/lib/bakery/types";
import { useCartStore } from "@/lib/store/cart";
import { formatMoney } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CartPageClient({
  locale,
  shippingFee,
  freeFrom,
}: {
  locale: Locale;
  shippingFee: number;
  freeFrom: number;
}) {
  const t = useTranslations("Cart");
  const items = useCartStore((s) => s.items);
  const setQty = useCartStore((s) => s.setQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const couponCode = useCartStore((s) => s.couponCode);
  const couponDiscount = useCartStore((s) => s.couponDiscount);
  const setCoupon = useCartStore((s) => s.setCoupon);

  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { subtotal, discount, shippingFee: computedShipping, total } = calcOrderTotal({
    items,
    discount: couponDiscount,
    shipping: { fee: shippingFee, freeFrom },
  });
  const remainingForFreeShip = Math.max(0, freeFrom - subtotal);

  function handleApplyCoupon() {
    setCouponError(null);
    startTransition(async () => {
      const result = await applyCoupon(couponInput, subtotal);
      if (result.ok) {
        setCoupon(result.code, result.discount);
        setCouponInput("");
      } else {
        setCouponError(result.message);
      }
    });
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <ShoppingBag className="text-muted-foreground mx-auto size-16" />
        <p className="mt-4 text-lg font-medium">{t("empty")}</p>
        <Button className="mt-6 rounded-full" asChild>
          <Link href="/san-pham">{t("continueShopping")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-bold">{t("title")}</h1>

      {remainingForFreeShip > 0 ? (
        <div className="bg-secondary/40 mt-4 rounded-2xl p-4 text-sm">
          {t("freeShipFrom", { amount: formatMoney(remainingForFreeShip, locale) })}
        </div>
      ) : (
        <div className="bg-success/15 text-success-foreground mt-4 rounded-2xl p-4 text-sm">
          {t("freeShip")}
        </div>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="divide-border divide-y">
          {items.map((item) => (
            <div key={item.lineId} className="flex gap-4 py-5">
              <div className="bg-muted relative size-24 shrink-0 overflow-hidden rounded-2xl">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link href={`/san-pham/${item.slug}`} className="hover:text-brand-accent font-medium">
                      {item.name}
                    </Link>
                    {Object.keys(item.options).length > 0 ? (
                      <p className="text-muted-foreground text-xs">{Object.values(item.options).join(", ")}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.lineId)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={t("remove")}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="border-input inline-flex items-center rounded-full border">
                    <button
                      type="button"
                      onClick={() => setQty(item.lineId, item.qty - 1)}
                      className="hover:bg-muted rounded-l-full p-2"
                      aria-label="-"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty(item.lineId, item.qty + 1)}
                      className="hover:bg-muted rounded-r-full p-2"
                      aria-label="+"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <span className="text-brand-accent font-semibold">
                    {formatMoney(item.unitPrice * item.qty, locale)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-secondary/30 h-fit space-y-4 rounded-3xl p-6">
          {couponCode ? (
            <div className="bg-success/15 text-success-foreground flex items-center justify-between rounded-full px-4 py-2 text-sm">
              <span>{t("couponApplied", { code: couponCode })}</span>
              <button type="button" onClick={() => setCoupon(null, 0)} aria-label={t("removeCoupon")}>
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <div>
              <div className="flex gap-2">
                <label htmlFor="coupon-input" className="sr-only">
                  {t("couponPlaceholder")}
                </label>
                <Input
                  id="coupon-input"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder={t("couponPlaceholder")}
                  aria-invalid={!!couponError}
                  aria-describedby={couponError ? "coupon-error" : undefined}
                  className="rounded-full"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 rounded-full"
                  disabled={!couponInput || isPending}
                  onClick={handleApplyCoupon}
                >
                  {t("applyCoupon")}
                </Button>
              </div>
              {couponError ? (
                <p id="coupon-error" className="text-destructive mt-1 text-xs">
                  {couponError}
                </p>
              ) : null}
            </div>
          )}

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("subtotal")}</span>
              <span>{formatMoney(subtotal, locale)}</span>
            </div>
            {discount > 0 ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("discount")}</span>
                <span>-{formatMoney(discount, locale)}</span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("shipping")}</span>
              <span>{computedShipping === 0 ? "0 ₫" : formatMoney(computedShipping, locale)}</span>
            </div>
            <div className="border-border flex justify-between border-t pt-2 font-semibold">
              <span>{t("total")}</span>
              <span className="text-brand-accent text-lg">{formatMoney(total, locale)}</span>
            </div>
          </div>

          <Button className="w-full rounded-full" size="lg" asChild>
            <Link href="/thanh-toan">{t("checkout")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
