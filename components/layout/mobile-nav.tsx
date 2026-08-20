"use client";

import { Grid2x2, Home, ShoppingBag, User } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { cartCount as getCartCount, useCartStore } from "@/lib/store/cart";
import { Badge } from "@/components/ui/badge";

const ITEMS = [
  { key: "home", href: "/", icon: Home },
  { key: "products", href: "/san-pham", icon: Grid2x2 },
  { key: "cart", href: "/gio-hang", icon: ShoppingBag },
  { key: "account", href: "/tai-khoan", icon: User },
] as const;

/** Bottom tab bar for mobile — muc 8.11. */
export function MobileNav() {
  const t = useTranslations("MobileNav");
  const pathname = usePathname();
  const items = useCartStore((s) => s.items);
  const cartCount = getCartCount(items);

  return (
    <nav className="bg-background/95 border-border fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t px-2 py-1.5 backdrop-blur lg:hidden">
      {ITEMS.map(({ key, href, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={key}
            href={href}
            className={cn(
              "relative flex min-w-14 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[11px] font-medium",
              active ? "text-brand-accent" : "text-muted-foreground",
            )}
          >
            <Icon className="size-5" />
            {key === "cart" && cartCount > 0 ? (
              <Badge className="absolute -top-0.5 right-1 h-4 min-w-4 justify-center rounded-full px-1 text-[9px]">
                {cartCount}
              </Badge>
            ) : null}
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}
