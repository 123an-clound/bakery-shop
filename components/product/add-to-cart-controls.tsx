"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import type { ProductData } from "@/lib/bakery/schemas";
import type { Locale } from "@/lib/bakery/types";
import { t as tField } from "@/lib/i18n/text";
import { formatMoney } from "@/lib/utils/format";
import { fireConfetti } from "@/components/motion/confetti";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Cart state (Zustand) isn't wired up until Phase 4 — variant/quantity
 * selection and live price math are real here (no cart dependency needed),
 * but the two action buttons are honest about not persisting anything yet,
 * same pattern as the newsletter section.
 */
export function AddToCartControls({ data, locale }: { data: ProductData; locale: Locale }) {
  const t = useTranslations("ProductDetail");
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
    fireConfetti({ enabled: true, particleCount: 40 });
    toast.info(
      action === "cart"
        ? "Gio hang se hoat dong day du o buoc tiep theo cua du an."
        : "Thanh toan se hoat dong day du o buoc tiep theo cua du an.",
    );
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
