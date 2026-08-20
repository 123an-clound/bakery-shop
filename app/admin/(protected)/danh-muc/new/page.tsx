import type { Metadata } from "next";

import { CategoryForm } from "@/components/admin/categories/category-form";

export const metadata: Metadata = { title: "Thêm danh mục" };

export default function NewCategoryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Thêm danh mục</h1>
      <CategoryForm />
    </div>
  );
}
