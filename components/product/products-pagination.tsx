import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export function ProductsPagination({
  page,
  pageCount,
  buildHref,
}: {
  page: number;
  pageCount: number;
  buildHref: (page: number) => string;
}) {
  const t = useTranslations("Products");
  if (pageCount <= 1) return null;

  return (
    <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
      <Button variant="outline" size="sm" className="rounded-full" disabled={page <= 1} asChild={page > 1}>
        {page > 1 ? <Link href={buildHref(page - 1)}>{t("pagePrev")}</Link> : <span>{t("pagePrev")}</span>}
      </Button>
      <span className="text-muted-foreground text-sm">
        {page} / {pageCount}
      </span>
      <Button
        variant="outline"
        size="sm"
        className="rounded-full"
        disabled={page >= pageCount}
        asChild={page < pageCount}
      >
        {page < pageCount ? (
          <Link href={buildHref(page + 1)}>{t("pageNext")}</Link>
        ) : (
          <span>{t("pageNext")}</span>
        )}
      </Button>
    </nav>
  );
}
