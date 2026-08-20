import type { Metadata } from "next";

import { listAdminReviews } from "@/lib/bakery/admin/reviews";
import { listAdminProducts } from "@/lib/bakery/admin/products";
import { t as tField } from "@/lib/i18n/text";
import { ReviewsClient } from "@/components/admin/reviews/reviews-client";

export const metadata: Metadata = { title: "Đánh giá" };

export default async function AdminReviewsPage() {
  const [reviews, products] = await Promise.all([listAdminReviews(), listAdminProducts()]);
  const productNames = new Map(products.map((p) => [p.id, tField(p.data.name, "vi")]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Đánh giá</h1>
      <ReviewsClient reviews={reviews} productNames={productNames} />
    </div>
  );
}
