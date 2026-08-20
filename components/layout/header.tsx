"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Menu, Search, ShoppingBag, User } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

const NAV_ITEMS = [
  { key: "home", href: "/" },
  { key: "products", href: "/san-pham" },
  { key: "customCake", href: "/dat-banh-theo-yeu-cau" },
  { key: "blog", href: "/tin-tuc" },
  { key: "about", href: "/gioi-thieu" },
  { key: "contact", href: "/lien-he" },
] as const;

export function Header({
  brandName,
  logoUrl,
  cartCount = 0,
}: {
  brandName: string;
  logoUrl?: string;
  cartCount?: number;
}) {
  const t = useTranslations("Nav");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "bg-background/85 sticky top-0 z-40 backdrop-blur transition-[padding,box-shadow] duration-300",
        scrolled ? "shadow-soft py-2" : "py-4",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          {logoUrl ? (
            <Image src={logoUrl} alt={brandName} width={40} height={40} className="rounded-full" />
          ) : null}
          <span className="font-heading text-primary text-xl font-bold">{brandName}</span>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-6 lg:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="hover:text-primary text-sm font-medium transition-colors"
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="relative hidden flex-1 max-w-xs items-center md:flex lg:max-w-56">
          <Search className="text-muted-foreground pointer-events-none absolute left-3 size-4" />
          <Input placeholder={t("search")} className="rounded-full pl-9" />
        </div>

        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <LanguageSwitcher />
          <Button variant="ghost" size="icon" className="rounded-full" asChild>
            <Link href="/tai-khoan" aria-label={t("account")}>
              <User className="size-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="relative rounded-full" asChild>
            <Link href="/gio-hang" aria-label={t("cart")}>
              <ShoppingBag className="size-5" />
              {cartCount > 0 ? (
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 justify-center rounded-full px-1">
                  {cartCount}
                </Badge>
              ) : null}
            </Link>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full lg:hidden" aria-label="Menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>{brandName}</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    className="hover:bg-muted rounded-xl px-3 py-2.5 text-sm font-medium"
                  >
                    {t(item.key)}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
