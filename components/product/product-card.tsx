import Image from "next/image";
import { Star } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { ProductData } from "@/lib/bakery/schemas";
import type { Locale } from "@/lib/bakery/types";
import { t } from "@/lib/i18n/text";
import { formatMoney } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";

const BADGE_LABEL: Record<string, { vi: string; en: string }> = {
  new: { vi: "Mới", en: "New" },
  hot: { vi: "Hot", en: "Hot" },
};

export function ProductCard({
  slug,
  data,
  locale,
  priority = false,
}: {
  slug: string;
  data: ProductData;
  locale: Locale;
  /** Set on the first above-the-fold card in a grid to fix the LCP image warning. */
  priority?: boolean;
}) {
  const image = data.images[0];
  const hasSale = data.sale_price != null && data.sale_price < data.price;

  return (
    <Link
      href={`/san-pham/${slug}`}
      className="group focus-visible:ring-primary block rounded-3xl focus-visible:ring-4 focus-visible:outline-none"
    >
      <div className="bg-muted shadow-soft relative aspect-square overflow-hidden rounded-3xl">
        {image ? (
          <Image
            src={image}
            alt={t(data.name, locale)}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : null}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {data.badges.map((badge) => (
            <Badge key={badge} className="rounded-full">
              {BADGE_LABEL[badge]?.[locale] ?? badge}
            </Badge>
          ))}
          {hasSale ? (
            <Badge variant="secondary" className="rounded-full">
              -{Math.round((1 - data.sale_price! / data.price) * 100)}%
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="mt-3 space-y-1">
        <h3 className="group-hover:text-primary line-clamp-1 text-sm font-semibold transition-colors sm:text-base">
          {t(data.name, locale)}
        </h3>
        {data.rating_count > 0 ? (
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <Star className="fill-primary text-primary size-3.5" />
            <span>{data.rating_avg.toFixed(1)}</span>
            <span>({data.rating_count})</span>
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <span className="font-heading text-primary font-bold">
            {formatMoney(hasSale ? data.sale_price! : data.price, locale)}
          </span>
          {hasSale ? (
            <span className="text-muted-foreground text-xs line-through">
              {formatMoney(data.price, locale)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
