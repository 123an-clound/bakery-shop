import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAdminProduct } from "@/lib/bakery/admin/products";
import { listAdminCategories } from "@/lib/bakery/admin/categories";
import { ProductForm } from "@/components/admin/products/product-form";

export const metadata: Metadata = { title: "Sửa sản phẩm" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId)) notFound();

  const [product, categories] = await Promise.all([getAdminProduct(productId), listAdminCategories()]);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Sửa sản phẩm</h1>
      <ProductForm initial={product} categories={categories} />
    </div>
  );
}
