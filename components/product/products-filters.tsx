"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import type { CategoryData } from "@/lib/bakery/schemas";
import type { Locale } from "@/lib/bakery/types";
import { t as tField } from "@/lib/i18n/text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface CategoryOption {
  slug: string;
  data: CategoryData;
}

const SORT_OPTIONS = ["newest", "price_asc", "price_desc", "best_selling", "rating"] as const;

export function ProductsFilters({
  categories,
  activeCategorySlug,
  currentParams,
  locale,
}: {
  categories: CategoryOption[];
  activeCategorySlug?: string;
  currentParams: Record<string, string | undefined>;
  locale: Locale;
}) {
  const t = useTranslations("Products");
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(currentParams.q ?? "");
  const [minPrice, setMinPrice] = useState(currentParams.min ?? "");
  const [maxPrice, setMaxPrice] = useState(currentParams.max ?? "");

  function pushParams(next: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { ...currentParams, ...next, page: undefined };
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
    }
    const query = params.toString();
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  }

  // Debounce free-text search — pushes to the URL 400ms after typing stops.
  useEffect(() => {
    const handle = setTimeout(() => {
      if (search !== (currentParams.q ?? "")) pushParams({ q: search || undefined });
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when `search` changes
  }, [search]);

  return (
    <aside className={cn("space-y-6", isPending && "opacity-60")}>
      <div>
        <label htmlFor="product-search" className="mb-1.5 block text-sm font-medium">
          {t("search")}
        </label>
        <Input
          id="product-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="rounded-full"
        />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">{t("category")}</h3>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => router.push(pathname)}
            className={cn(
              "rounded-xl px-3 py-1.5 text-left text-sm hover:bg-muted",
              !activeCategorySlug && "bg-primary/15 text-primary font-medium",
            )}
          >
            {t("allCategories")}
          </button>
          {categories.map((c) => (
            <Button
              key={c.slug}
              variant="link"
              asChild
              className={cn(
                "h-auto justify-start rounded-xl px-3 py-1.5 text-sm no-underline hover:bg-muted",
                activeCategorySlug === c.slug && "bg-primary/15 text-primary font-medium",
              )}
            >
              <Link href={`/danh-muc/${c.slug}`}>{tField(c.data.name, locale)}</Link>
            </Button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">{t("priceRange")}</h3>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder={t("min")}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            onBlur={() => pushParams({ min: minPrice || undefined })}
            className="rounded-full"
          />
          <span className="text-muted-foreground">—</span>
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder={t("max")}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onBlur={() => pushParams({ max: maxPrice || undefined })}
            className="rounded-full"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">{t("sortBy")}</h3>
        <select
          value={currentParams.sort ?? "newest"}
          onChange={(e) => pushParams({ sort: e.target.value })}
          className="border-input bg-background w-full rounded-full border px-3 py-2 text-sm"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {t(`sort.${opt}`)}
            </option>
          ))}
        </select>
      </div>
    </aside>
  );
}
