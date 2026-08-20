"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";

import { submitReview, type SubmitReviewState } from "@/lib/actions/reviews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const initialState: SubmitReviewState = { status: "idle" };

export function ReviewForm({ productId }: { productId: number }) {
  const t = useTranslations("ProductDetail");
  const [state, formAction, isPending] = useActionState(submitReview, initialState);
  const [rating, setRating] = useState(5);

  if (state.status === "success") {
    return <p className="bg-success/15 text-success-foreground rounded-2xl p-4 text-sm">{state.message}</p>;
  }

  return (
    <form action={formAction} className="bg-muted/50 space-y-3 rounded-3xl p-5">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />

      <div className="flex gap-1" role="radiogroup" aria-label="Rating">
        {Array.from({ length: 5 }, (_, i) => {
          const value = i + 1;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} sao`}
              onClick={() => setRating(value)}
              className="focus-visible:ring-primary rounded focus-visible:ring-2 focus-visible:outline-none"
            >
              <Star className={cn("size-6", value <= rating ? "fill-primary text-primary" : "text-muted-foreground")} />
            </button>
          );
        })}
      </div>

      <Input
        name="author"
        placeholder={t("reviewAuthorPlaceholder")}
        required
        maxLength={80}
        className="rounded-full"
      />
      <textarea
        name="content"
        required
        minLength={5}
        maxLength={2000}
        rows={3}
        placeholder={t("reviewContentPlaceholder")}
        className="border-input w-full rounded-2xl border p-3 text-sm"
      />

      {state.status === "error" ? <p className="text-destructive text-sm">{state.message}</p> : null}

      <Button type="submit" disabled={isPending} className="rounded-full">
        {isPending ? "..." : t("submitReview")}
      </Button>
    </form>
  );
}
