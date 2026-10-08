"use client";

import { ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import type { ProductData } from "@/lib/bakery/schemas";
import type { Locale } from "@/lib/bakery/types";
import { t as tField } from "@/lib/i18n/text";
import { useCartStore } from "@/lib/store/cart";
import { cn } from "@/lib/utils";

/** One-click add from a product card using each option's first choice; the server re-prices on checkout. */
export function QuickAddButton({
  productId,
  slug,
  data,
  locale,
  className,
}: {
  productId: number;
  slug: string;
  data: ProductData;
  locale: Locale;
  className?: string;
}) {
  const t = useTranslations("ProductDetail");
  const addItem = useCartStore((s) => s.addItem);
  const name = tField(data.name, locale);

  function handleClick() {
    const options = Object.fromEntries(data.options.map((opt) => [opt.key, opt.choices[0]?.value ?? ""]));
    const delta = data.options.reduce((sum, opt) => sum + (opt.choices[0]?.price_delta ?? 0), 0);
    const hasSale = data.sale_price != null && data.sale_price < data.price;
    addItem({
      productId,
      slug,
      name,
      image: data.images[0],
      unitPrice: (hasSale ? data.sale_price! : data.price) + delta,
      prepTimeHours: data.prep_time_hours,
      options,
    });
    toast.success(t("addedToCart"));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`${t("addToCart")}: ${name}`}
      className={cn(
        "bg-background/90 text-foreground hover:bg-primary hover:text-primary-foreground focus-visible:ring-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md text-sm font-medium backdrop-blur-md transition-colors duration-300 focus-visible:ring-2 focus-visible:outline-none",
        className,
      )}
    >
      <ShoppingBag className="size-4" strokeWidth={1.5} />
      {t("addToCart")}
    </button>
  );
}
