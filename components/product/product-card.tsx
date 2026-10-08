import Image from "next/image";
import { Star } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { ProductData } from "@/lib/bakery/schemas";
import type { Locale } from "@/lib/bakery/types";
import { t } from "@/lib/i18n/text";
import { formatMoney } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/product/favorite-button";
import { QuickAddButton } from "@/components/product/quick-add-button";

const BADGE_LABEL: Record<string, { vi: string; en: string }> = {
  new: { vi: "Mới", en: "New" },
  hot: { vi: "Hot", en: "Hot" },
};

export function ProductCard({
  id,
  slug,
  data,
  locale,
  priority = false,
  isFavorited = false,
}: {
  id: number;
  slug: string;
  data: ProductData;
  locale: Locale;
  /** Set on the first above-the-fold card in a grid to fix the LCP image warning. */
  priority?: boolean;
  isFavorited?: boolean;
}) {
  const image = data.images[0];
  const hasSale = data.sale_price != null && data.sale_price < data.price;
  const outOfStock = data.stock != null && data.stock <= 0;

  return (
    // The title link is stretched over the whole card (after:inset-0); the
    // favorite + quick-add buttons sit above it with z-10.
    <article className="group bg-card shadow-soft hover:shadow-lift relative flex h-full flex-col rounded-xl p-3 transition-shadow duration-500 focus-within:ring-2 focus-within:ring-ring">
      <div className="bg-muted relative aspect-[4/5] overflow-hidden rounded-lg">
        {image ? (
          <Image
            src={image}
            alt={t(data.name, locale)}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 46vw"
            className="object-cover transition-transform duration-[400ms] ease-out group-hover:scale-105"
          />
        ) : null}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1">
          {data.badges.map((badge) => (
            <Badge key={badge} className="rounded-sm px-2 text-[0.65rem] tracking-[0.15em] uppercase">
              {BADGE_LABEL[badge]?.[locale] ?? badge}
            </Badge>
          ))}
          {hasSale ? (
            <Badge variant="secondary" className="rounded-sm px-2 text-[0.65rem]">
              -{Math.round((1 - data.sale_price! / data.price) * 100)}%
            </Badge>
          ) : null}
        </div>
        <FavoriteButton productId={id} initialFavorited={isFavorited} className="absolute top-3 right-3 z-10" />
        {outOfStock ? null : (
          <QuickAddButton
            productId={id}
            slug={slug}
            data={data}
            locale={locale}
            className="absolute inset-x-3 bottom-3 z-10 transition-[transform,opacity,background-color,color] duration-300 ease-out [@media(hover:hover)]:translate-y-[calc(100%+0.75rem)] [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:translate-y-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col items-center px-1 pt-5 pb-2 text-center">
        <h3 className="font-heading line-clamp-2 text-base leading-snug font-medium sm:text-lg">
          <Link href={`/san-pham/${slug}`} className="outline-none after:absolute after:inset-0 after:rounded-xl">
            {t(data.name, locale)}
          </Link>
        </h3>
        {data.rating_count > 0 ? (
          <div className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
            <Star className="fill-primary text-primary size-3.5" />
            <span>{data.rating_avg.toFixed(1)}</span>
            <span>({data.rating_count})</span>
          </div>
        ) : null}
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="text-brand-accent text-sm font-semibold tracking-wide sm:text-base">
            {formatMoney(hasSale ? data.sale_price! : data.price, locale)}
          </span>
          {hasSale ? (
            <span className="text-muted-foreground text-xs line-through">{formatMoney(data.price, locale)}</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
