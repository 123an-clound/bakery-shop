import type { Metadata } from "next";

import { listAdminCategories } from "@/lib/bakery/admin/categories";
import { CategoriesClient } from "@/components/admin/categories/categories-client";

export const metadata: Metadata = { title: "Danh mục" };

export default async function AdminCategoriesPage() {
  const categories = await listAdminCategories();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Danh mục</h1>
      <CategoriesClient categories={categories} />
    </div>
  );
}
