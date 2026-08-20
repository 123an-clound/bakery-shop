import type { Metadata } from "next";

import { listAdminProducts } from "@/lib/bakery/admin/products";
import { listAdminCategories } from "@/lib/bakery/admin/categories";
import { ProductsClient } from "@/components/admin/products/products-client";

export const metadata: Metadata = { title: "Sản phẩm" };

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([listAdminProducts(), listAdminCategories()]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Sản phẩm</h1>
      <ProductsClient products={products} categories={categories} />
    </div>
  );
}
