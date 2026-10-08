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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

// Desktop: the logo (= home) sits centered, nav split around it.
const NAV_LEFT = NAV_ITEMS.slice(1, 4);
const NAV_RIGHT = NAV_ITEMS.slice(4);
const ICON_STROKE = 1.5;

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
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The home hero slides under the header (-mt-18), so the header starts
  // transparent with white text there and turns to frosted glass on scroll.
  const overHero = pathname === "/" && !scrolled;
  const searchAction = locale === "en" ? "/en/san-pham" : "/san-pham";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 h-18 transition-[background-color,box-shadow,color,border-color] duration-300",
        overHero
          ? "border-b border-transparent bg-transparent text-white"
          : "bg-background/80 text-foreground border-border/60 border-b backdrop-blur-xl backdrop-saturate-150",
        scrolled && "shadow-soft",
      )}
    >
      <div className="mx-auto grid h-full max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="min-h-11 min-w-11 rounded-full xl:hidden" aria-label="Menu">
                <Menu className="size-5" strokeWidth={ICON_STROKE} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle className="font-heading text-xl">{brandName}</SheetTitle>
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
                        "rounded-lg px-3 py-3 text-sm font-medium transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                        active ? "bg-secondary text-brand-accent" : "text-foreground/80 hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {t(item.key)}
                    </Link>
                  );
                })}
              </nav>
              <div className="border-border mt-4 flex items-center gap-1 border-t px-4 pt-4">
                <LanguageSwitcher />
                <ColorModeToggle />
              </div>
            </SheetContent>
          </Sheet>

          <nav className="hidden items-center gap-7 xl:flex">
            {NAV_LEFT.map((item) => (
              <NavLink key={item.key} href={item.href} label={t(item.key)} active={isActive(item.href)} />
            ))}
          </nav>
        </div>

        <Link href="/" className="flex min-w-0 max-w-[48vw] items-center justify-center gap-2 sm:max-w-xs">
          {logoUrl ? <Image src={logoUrl} alt="" width={36} height={36} className="shrink-0 rounded-full" /> : null}
          <span className="font-heading truncate text-base font-semibold tracking-wide sm:text-2xl">{brandName}</span>
        </Link>

        <div className="flex items-center justify-end gap-0.5">
          <div className="mr-4 hidden items-center gap-7 xl:flex">
            {NAV_RIGHT.map((item) => (
              <NavLink key={item.key} href={item.href} label={t(item.key)} active={isActive(item.href)} />
            ))}
          </div>
          <div className="hidden items-center gap-0.5 sm:flex">
            <LanguageSwitcher />
            <ColorModeToggle />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="min-h-11 min-w-11 rounded-full" aria-label={t("search")}>
                <Search className="size-5" strokeWidth={ICON_STROKE} />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72">
              <form action={searchAction} method="get" role="search">
                <Input name="q" type="search" placeholder={t("search")} aria-label={t("search")} autoFocus />
              </form>
            </PopoverContent>
          </Popover>
          <div className="hidden sm:block">
            {userEmail ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="min-h-11 min-w-11 rounded-full" aria-label={t("account")}>
                    <User className="size-5" strokeWidth={ICON_STROKE} />
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
              <Button variant="ghost" size="icon" className="min-h-11 min-w-11 rounded-full" asChild>
                <Link href="/tai-khoan/dang-nhap" aria-label={tAuth("signInTitle")}>
                  <User className="size-5" strokeWidth={ICON_STROKE} />
                </Link>
              </Button>
            )}
          </div>
          <MiniCart locale={locale} />
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className="group relative py-2 text-sm font-medium tracking-wide whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
    >
      <span className={cn("transition-opacity duration-300", active ? "opacity-100" : "opacity-80 group-hover:opacity-100")}>
        {label}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "bg-primary absolute inset-x-0 bottom-0 h-px origin-left transition-transform duration-300",
          active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
        )}
      />
    </Link>
  );
}
