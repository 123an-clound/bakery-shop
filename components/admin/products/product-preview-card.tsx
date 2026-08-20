import Image from "next/image";
import { Star } from "lucide-react";

import type { ProductData } from "@/lib/bakery/schemas";
import { t } from "@/lib/i18n/text";
import { formatMoney } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";

/** Static (non-interactive) preview of the customer-facing `ProductCard` for the admin form. */
export function ProductPreviewCard({ data }: { data: ProductData }) {
  const image = data.images[0];
  const hasSale = data.sale_price != null && data.sale_price < data.price;

  return (
    <div className="w-full max-w-xs">
      <div className="bg-muted relative aspect-square overflow-hidden rounded-3xl shadow-sm">
        {image ? (
          <Image src={image} alt="" fill sizes="320px" className="object-cover" />
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center text-xs">Chưa có ảnh</div>
        )}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {data.badges.map((badge) => (
            <Badge key={badge} className="rounded-full">
              {badge}
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
        <h3 className="line-clamp-1 text-sm font-semibold sm:text-base">{t(data.name, "vi") || "Tên sản phẩm"}</h3>
        {data.rating_count > 0 ? (
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <Star className="fill-primary text-primary size-3.5" />
            <span>{data.rating_avg.toFixed(1)}</span>
            <span>({data.rating_count})</span>
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <span className="text-brand-accent font-bold">{formatMoney(hasSale ? data.sale_price! : data.price)}</span>
          {hasSale ? <span className="text-muted-foreground text-xs line-through">{formatMoney(data.price)}</span> : null}
        </div>
      </div>
    </div>
  );
}
