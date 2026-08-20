"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import type { ProductData } from "@/lib/bakery/schemas";
import type { Locale } from "@/lib/bakery/types";
import { t as tField } from "@/lib/i18n/text";
import { formatMoney } from "@/lib/utils/format";
import { useCartStore } from "@/lib/store/cart";
import { fireConfetti } from "@/components/motion/confetti";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AddToCartControls({
  productId,
  slug,
  data,
  locale,
  confettiEnabled = true,
}: {
  productId: number;
  slug: string;
  data: ProductData;
  locale: Locale;
  confettiEnabled?: boolean;
}) {
  const t = useTranslations("ProductDetail");
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() =>
    Object.fromEntries(data.options.map((opt) => [opt.key, opt.choices[0]?.value ?? ""])),
  );
  const [qty, setQty] = useState(1);

  const hasSale = data.sale_price != null && data.sale_price < data.price;

  const optionsDelta = useMemo(
    () =>
      data.options.reduce((sum, opt) => {
        const choice = opt.choices.find((c) => c.value === selectedOptions[opt.key]);
        return sum + (choice?.price_delta ?? 0);
      }, 0),
    [data.options, selectedOptions],
  );
  const unitPrice = (hasSale ? data.sale_price! : data.price) + optionsDelta;
  const originalUnitPrice = data.price + optionsDelta;

  const outOfStock = data.stock !== null && data.stock !== undefined && data.stock <= 0;

  function handleAction(action: "cart" | "buy") {
    addItem(
      {
        productId,
        slug,
        name: tField(data.name, locale),
        image: data.images[0],
        unitPrice,
        options: selectedOptions,
      },
      qty,
    );
    fireConfetti({ enabled: confettiEnabled, particleCount: 40 });

    if (action === "buy") {
      router.push("/gio-hang");
    } else {
      toast.success(t("addedToCart"));
    }
  }

  return (
    <div className="space-y-5">
      {data.options.map((option) => (
        <div key={option.key}>
          <span className="mb-2 block text-sm font-medium">{tField(option.label, locale)}</span>
          <div className="flex flex-wrap gap-2">
            {option.choices.map((choice) => (
              <button
                key={choice.value}
                type="button"
                onClick={() => setSelectedOptions((prev) => ({ ...prev, [option.key]: choice.value }))}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm transition-colors",
                  selectedOptions[option.key] === choice.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-input hover:bg-muted",
                )}
              >
                {tField(choice.label, locale)}
                {choice.price_delta ? ` (+${formatMoney(choice.price_delta, locale)})` : ""}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <span className="font-heading text-primary text-3xl font-bold">{formatMoney(unitPrice, locale)}</span>
        {hasSale ? (
          <span className="text-muted-foreground text-lg line-through">
            {formatMoney(originalUnitPrice, locale)}
          </span>
        ) : null}
      </div>

      {outOfStock ? (
        <p className="text-destructive text-sm font-medium">{t("outOfStock")}</p>
      ) : (
        <>
          <div>
            <span className="mb-2 block text-sm font-medium">{t("quantity")}</span>
            <div className="border-input inline-flex items-center rounded-full border">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="hover:bg-muted rounded-l-full p-2.5"
                aria-label="-"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-10 text-center text-sm font-medium">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                className="hover:bg-muted rounded-r-full p-2.5"
                aria-label="+"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button size="lg" className="rounded-full px-8" onClick={() => handleAction("cart")}>
              <ShoppingBag className="mr-1 size-4" />
              {t("addToCart")}
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8" onClick={() => handleAction("buy")}>
              {t("buyNow")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
