"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/bakery/types";
import { useCartStore } from "@/lib/store/cart";
import { Button } from "@/components/ui/button";
import { CheckoutForm } from "./checkout-form";
import { useCartHydrated } from "@/hooks/use-cart-hydrated";

export function CheckoutPageClient({
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
  const tCart = useTranslations("Cart");
  const items = useCartStore((s) => s.items);
  const hydrated = useCartHydrated();

  if (!hydrated) return <div aria-busy="true" aria-label={t("pageTitle")} className="mx-auto min-h-[1100px] w-full max-w-2xl px-4 py-10" />;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <p className="text-muted-foreground">{t("emptyCart")}</p>
        <Button className="mt-6 rounded-full" asChild>
          <Link href="/san-pham">{tCart("continueShopping")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-heading mb-8 text-3xl font-bold">{t("pageTitle")}</h1>
      <CheckoutForm locale={locale} shippingFee={shippingFee} freeFrom={freeFrom} bankTransferEnabled={bankTransferEnabled} />
    </div>
  );
}
