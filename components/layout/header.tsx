"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Heart, Menu, Search, User } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/bakery/types";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { MiniCart } from "@/components/cart/mini-cart";
import { ColorModeToggle } from "@/components/theme/color-mode-toggle";

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
  locale,
  userEmail,
}: {
  brandName: string;
  logoUrl?: string;
  locale: Locale;
  userEmail: string | null;
}) {
  const t = useTranslations("Nav");
  const tAccount = useTranslations("Account");
  const tAuth = useTranslations("Auth");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

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
        "bg-background sticky top-0 z-40 transition-[padding,box-shadow] duration-300",
        scrolled ? "shadow-soft py-2" : "py-4",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          {logoUrl ? (
            <Image src={logoUrl} alt={brandName} width={40} height={40} className="shrink-0 rounded-full" />
          ) : null}
          {/* Admin-configurable brand name — truncate instead of overflowing
              the header on narrow viewports (min-w-0 lets this flex child
              shrink below its content size so truncate can take effect). */}
          <span className="font-heading text-brand-accent truncate text-xl font-bold">{brandName}</span>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-6 lg:flex">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative rounded-full px-1 py-2 text-sm font-medium outline-none transition-[color,transform] duration-200 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4",
                  active ? "text-brand-accent" : "text-foreground/75 hover:text-brand-accent",
                )}
              >
                {t(item.key)}
                <span
                  aria-hidden="true"
                  className={cn(
                    "bg-brand-accent absolute inset-x-1 -bottom-0.5 h-0.5 origin-center rounded-full transition-transform duration-200",
                    active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                  )}
                />
              </Link>
            );
          })}
        </nav>

        <div className="relative hidden flex-1 max-w-xs items-center md:flex lg:max-w-56">
          <Search className="text-muted-foreground pointer-events-none absolute left-3 size-4" />
          <Input placeholder={t("search")} aria-label={t("search")} className="rounded-full pl-9" />
        </div>

        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <LanguageSwitcher />
          <ColorModeToggle />
          {userEmail ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" aria-label={t("account")}>
                  <User className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="truncate font-normal">{userEmail}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/tai-khoan">{tAccount("pageTitle")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/tai-khoan/yeu-thich">
                    <Heart className="size-4" />
                    {tAccount("favoritesLink")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild variant="destructive">
                  <form action={signOut} className="w-full">
                    <button type="submit" className="w-full text-left">
                      {tAccount("signOut")}
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="icon" className="rounded-full" asChild>
              <Link href="/tai-khoan/dang-nhap" aria-label={tAuth("signInTitle")}>
                <User className="size-5" />
              </Link>
            </Button>
          )}
          <MiniCart locale={locale} />

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
                {NAV_ITEMS.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "rounded-xl px-3 py-3 text-sm font-medium transition-[background-color,color,transform] duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active
                          ? "bg-brand-accent/12 text-brand-accent"
                          : "text-foreground/75 hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {t(item.key)}
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-4 border-t border-border px-4 pt-4">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>Giao diện</span>
                  <ColorModeToggle />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
