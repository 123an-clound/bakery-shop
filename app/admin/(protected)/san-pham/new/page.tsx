import type { Metadata } from "next";

import { listAdminCategories } from "@/lib/bakery/admin/categories";
import { ProductForm } from "@/components/admin/products/product-form";

export const metadata: Metadata = { title: "Thêm sản phẩm" };

export default async function NewProductPage() {
  const categories = await listAdminCategories();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Thêm sản phẩm</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
