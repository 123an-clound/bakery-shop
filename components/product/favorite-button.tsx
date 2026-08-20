"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { toggleFavorite } from "@/lib/actions/favorites";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  productId,
  initialFavorited = false,
  className,
}: {
  productId: number;
  initialFavorited?: boolean;
  className?: string;
}) {
  const t = useTranslations("Favorites");
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const result = await toggleFavorite(productId);
      if (!result.ok) {
        if (result.message === "sign_in_required") {
          toast.info(t("signInRequired"), {
            action: { label: "→", onClick: () => router.push("/tai-khoan/dang-nhap") },
          });
        }
        return;
      }
      setFavorited(result.favorited);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={favorited ? t("remove") : t("add")}
      aria-pressed={favorited}
      className={cn(
        "focus-visible:ring-primary rounded-full bg-white/80 p-2 shadow-sm backdrop-blur transition-colors focus-visible:ring-4 focus-visible:outline-none",
        className,
      )}
    >
      <Heart className={cn("size-4", favorited ? "fill-destructive text-destructive" : "text-foreground")} />
    </button>
  );
}
