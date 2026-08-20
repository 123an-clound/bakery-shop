"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { AdminCategoryRow } from "@/lib/bakery/admin/categories";
import { categoryDataSchema, type CategoryData } from "@/lib/bakery/schemas";
import { createCategory, updateCategory } from "@/lib/actions/admin/categories";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUploader } from "@/components/admin/media/image-uploader";

const EMPTY: CategoryData = { name: { vi: "", en: "" }, description: { vi: "", en: "" }, image_url: "", icon: "" };

export function CategoryForm({ initial }: { initial?: AdminCategoryRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<CategoryData>(initial?.data ?? EMPTY);
  const [slug, setSlug] = useState(initial?.slug ?? "");

  function patch(fields: Partial<CategoryData>) {
    setData((prev) => ({ ...prev, ...fields }));
  }

  function save(status: "active" | "draft") {
    const parsed = categoryDataSchema.safeParse(data);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dữ liệu chưa hợp lệ.");
      return;
    }
    startTransition(async () => {
      const input = { data: parsed.data, status, slug: slug || undefined };
      const result = initial ? await updateCategory(initial.id, input) : await createCategory(input);
      if (result.ok) {
        toast.success(status === "active" ? "Đã xuất bản danh mục." : "Đã lưu nháp.");
        router.push("/admin/danh-muc");
        router.refresh();
      } else {
        toast.error(result.error ?? "Có lỗi xảy ra.");
      }
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-lg border p-4">
        <Tabs defaultValue="vi">
          <TabsList>
            <TabsTrigger value="vi">Tiếng Việt</TabsTrigger>
            <TabsTrigger value="en">Tiếng Anh</TabsTrigger>
          </TabsList>
          <TabsContent value="vi" className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="name-vi">Tên danh mục *</Label>
              <Input id="name-vi" value={data.name.vi} onChange={(e) => patch({ name: { ...data.name, vi: e.target.value } })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="desc-vi">Mô tả</Label>
              <Textarea
                id="desc-vi"
                rows={3}
                value={data.description?.vi ?? ""}
                onChange={(e) => patch({ description: { ...data.description, vi: e.target.value } })}
              />
            </div>
          </TabsContent>
          <TabsContent value="en" className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="name-en">Category name</Label>
              <Input id="name-en" value={data.name.en ?? ""} onChange={(e) => patch({ name: { ...data.name, en: e.target.value } })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="desc-en">Description</Label>
              <Textarea
                id="desc-en"
                rows={3}
                value={data.description?.en ?? ""}
                onChange={(e) => patch({ description: { vi: data.description?.vi ?? "", en: e.target.value } })}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <Label>Ảnh danh mục</Label>
        <ImageUploader
          value={data.image_url ? [data.image_url] : []}
          onChange={(urls) => patch({ image_url: urls[0] ?? "" })}
          folder="categories"
          max={1}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
        <div className="space-y-1.5">
          <Label htmlFor="icon">Icon (tên lucide, vd: cake)</Label>
          <Input id="icon" value={data.icon ?? ""} onChange={(e) => patch({ icon: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slug">Đường dẫn (slug)</Label>
          <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="tự sinh nếu để trống" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" disabled={isPending} onClick={() => save("draft")}>
          Lưu nháp
        </Button>
        <Button type="button" disabled={isPending} onClick={() => save("active")}>
          Xuất bản
        </Button>
      </div>
    </div>
  );
}
