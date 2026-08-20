"use client";

import Image from "next/image";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { cartCount, cartSubtotal, useCartStore } from "@/lib/store/cart";
import type { Locale } from "@/lib/bakery/types";
import { formatMoney } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

export function MiniCart({ locale }: { locale: Locale }) {
  const t = useTranslations("Cart");
  const items = useCartStore((s) => s.items);
  const setQty = useCartStore((s) => s.setQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const count = cartCount(items);

  const pathname = usePathname();

  return (
    // Uncontrolled + keyed by pathname: navigating remounts the Sheet, which
    // resets it closed — avoids a setState-in-effect to sync `open` with
    // route changes.
    <Sheet key={pathname}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full" aria-label={t("title")}>
          <ShoppingBag className="size-5" />
          {count > 0 ? (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 justify-center rounded-full px-1">
              {count}
            </Badge>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t("title")}</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <p className="text-muted-foreground px-4 text-sm">{t("empty")}</p>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-4">
              {items.map((item) => (
                <div key={item.lineId} className="flex gap-3">
                  <div className="bg-muted relative size-16 shrink-0 overflow-hidden rounded-2xl">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium">{item.name}</p>
                    {Object.keys(item.options).length > 0 ? (
                      <p className="text-muted-foreground text-xs">{Object.values(item.options).join(", ")}</p>
                    ) : null}
                    <p className="text-brand-accent text-sm font-semibold">{formatMoney(item.unitPrice, locale)}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQty(item.lineId, item.qty - 1)}
                        className="border-input hover:bg-muted rounded-full border p-1"
                        aria-label="-"
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="w-6 text-center text-xs">{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => setQty(item.lineId, item.qty + 1)}
                        className="border-input hover:bg-muted rounded-full border p-1"
                        aria-label="+"
                      >
                        <Plus className="size-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.lineId)}
                        className="text-muted-foreground hover:text-destructive ml-auto"
                        aria-label={t("remove")}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-border space-y-3 border-t px-4 pt-4 pb-2">
              <div className="flex items-center justify-between font-semibold">
                <span>{t("subtotal")}</span>
                <span className="text-brand-accent">{formatMoney(cartSubtotal(items), locale)}</span>
              </div>
              <Button asChild className="w-full rounded-full">
                <Link href="/gio-hang">{t("viewCart")}</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
