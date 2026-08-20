import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAdminCategory } from "@/lib/bakery/admin/categories";
import { CategoryForm } from "@/components/admin/categories/category-form";

export const metadata: Metadata = { title: "Sửa danh mục" };

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const categoryId = Number(id);
  if (!Number.isInteger(categoryId)) notFound();

  const category = await getAdminCategory(categoryId);
  if (!category) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Sửa danh mục</h1>
      <CategoryForm initial={category} />
    </div>
  );
}
