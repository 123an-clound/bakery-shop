"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import type { AdminProductRow } from "@/lib/bakery/admin/products";
import type { AdminCategoryRow } from "@/lib/bakery/admin/categories";
import { productDataSchema, type ProductData } from "@/lib/bakery/schemas";
import { createProduct, updateProduct } from "@/lib/actions/admin/products";
import { t as tField } from "@/lib/i18n/text";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ImageUploader } from "@/components/admin/media/image-uploader";
import { ProductPreviewCard } from "./product-preview-card";

const EMPTY_PRODUCT: ProductData = {
  name: { vi: "", en: "" },
  short_description: { vi: "", en: "" },
  description: { vi: "", en: "" },
  sku: "",
  price: 0,
  sale_price: null,
  unit: { vi: "", en: "" },
  images: [],
  stock: null,
  is_featured: false,
  is_best_seller: false,
  badges: [],
  options: [],
  ingredients: { vi: "", en: "" },
  allergens: [],
  prep_time_hours: 24,
  rating_avg: 0,
  rating_count: 0,
  seo: undefined,
};

export function ProductForm({
  initial,
  categories,
}: {
  initial?: AdminProductRow;
  categories: AdminCategoryRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<ProductData>(initial?.data ?? EMPTY_PRODUCT);
  const [categoryId, setCategoryId] = useState<number | null>(initial?.categoryId ?? null);
  const [slug, setSlug] = useState(initial?.slug ?? "");

  function patch(fields: Partial<ProductData>) {
    setData((prev) => ({ ...prev, ...fields }));
  }

  function save(status: "active" | "draft") {
    const parsed = productDataSchema.safeParse(data);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dữ liệu chưa hợp lệ.");
      return;
    }
    startTransition(async () => {
      const input = { data: parsed.data, categoryId, status, slug: slug || undefined };
      const result = initial
        ? await updateProduct(initial.id, input)
        : await createProduct(input);
      if (result.ok) {
        toast.success(status === "active" ? "Đã xuất bản sản phẩm." : "Đã lưu nháp.");
        router.push("/admin/san-pham");
        router.refresh();
      } else {
        toast.error(result.error ?? "Có lỗi xảy ra.");
      }
    });
  }

  function addOption() {
    patch({ options: [...data.options, { key: "", label: { vi: "" }, choices: [{ value: "", label: { vi: "" }, price_delta: 0 }] }] });
  }

  function updateOption(index: number, patchValue: Partial<ProductData["options"][number]>) {
    const options = [...data.options];
    options[index] = { ...options[index]!, ...patchValue };
    patch({ options });
  }

  function removeOption(index: number) {
    patch({ options: data.options.filter((_, i) => i !== index) });
  }

  function addChoice(optionIndex: number) {
    const options = [...data.options];
    const option = options[optionIndex]!;
    options[optionIndex] = { ...option, choices: [...option.choices, { value: "", label: { vi: "" }, price_delta: 0 }] };
    patch({ options });
  }

  function updateChoice(optionIndex: number, choiceIndex: number, patchValue: Partial<ProductData["options"][number]["choices"][number]>) {
    const options = [...data.options];
    const option = options[optionIndex]!;
    const choices = [...option.choices];
    choices[choiceIndex] = { ...choices[choiceIndex]!, ...patchValue };
    options[optionIndex] = { ...option, choices };
    patch({ options });
  }

  function removeChoice(optionIndex: number, choiceIndex: number) {
    const options = [...data.options];
    const option = options[optionIndex]!;
    options[optionIndex] = { ...option, choices: option.choices.filter((_, i) => i !== choiceIndex) };
    patch({ options });
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div className="rounded-lg border p-4">
          <Tabs defaultValue="vi">
            <TabsList>
              <TabsTrigger value="vi">Tiếng Việt</TabsTrigger>
              <TabsTrigger value="en">Tiếng Anh</TabsTrigger>
            </TabsList>
            <TabsContent value="vi" className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label htmlFor="name-vi">Tên sản phẩm *</Label>
                <Input id="name-vi" value={data.name.vi} onChange={(e) => patch({ name: { ...data.name, vi: e.target.value } })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="short-vi">Mô tả ngắn</Label>
                <Input
                  id="short-vi"
                  value={data.short_description?.vi ?? ""}
                  onChange={(e) => patch({ short_description: { ...data.short_description, vi: e.target.value } })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="desc-vi">Mô tả chi tiết</Label>
                <Textarea
                  id="desc-vi"
                  rows={5}
                  value={data.description?.vi ?? ""}
                  onChange={(e) => patch({ description: { ...data.description, vi: e.target.value } })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ingredients-vi">Thành phần</Label>
                <Textarea
                  id="ingredients-vi"
                  rows={2}
                  value={data.ingredients?.vi ?? ""}
                  onChange={(e) => patch({ ingredients: { ...data.ingredients, vi: e.target.value } })}
                />
              </div>
            </TabsContent>
            <TabsContent value="en" className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label htmlFor="name-en">Product name</Label>
                <Input id="name-en" value={data.name.en ?? ""} onChange={(e) => patch({ name: { ...data.name, en: e.target.value } })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="short-en">Short description</Label>
                <Input
                  id="short-en"
                  value={data.short_description?.en ?? ""}
                  onChange={(e) => patch({ short_description: { vi: data.short_description?.vi ?? "", en: e.target.value } })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="desc-en">Description</Label>
                <Textarea
                  id="desc-en"
                  rows={5}
                  value={data.description?.en ?? ""}
                  onChange={(e) => patch({ description: { vi: data.description?.vi ?? "", en: e.target.value } })}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
          <div className="space-y-1.5">
            <Label htmlFor="price">Giá gốc (₫) *</Label>
            <Input id="price" type="number" min={0} value={data.price} onChange={(e) => patch({ price: Number(e.target.value) })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sale-price">Giá khuyến mãi (₫)</Label>
            <Input
              id="sale-price"
              type="number"
              min={0}
              value={data.sale_price ?? ""}
              onChange={(e) => patch({ sale_price: e.target.value ? Number(e.target.value) : null })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stock">Tồn kho (để trống = không giới hạn)</Label>
            <Input
              id="stock"
              type="number"
              min={0}
              value={data.stock ?? ""}
              onChange={(e) => patch({ stock: e.target.value ? Number(e.target.value) : null })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" value={data.sku ?? ""} onChange={(e) => patch({ sku: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prep">Thời gian chuẩn bị (giờ)</Label>
            <Input
              id="prep"
              type="number"
              min={0}
              value={data.prep_time_hours}
              onChange={(e) => patch({ prep_time_hours: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category">Danh mục</Label>
            <Select
              value={categoryId !== null ? String(categoryId) : "none"}
              onValueChange={(v) => setCategoryId(v === "none" ? null : Number(v))}
            >
              <SelectTrigger id="category" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Không có danh mục</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {tField(c.data.name, "vi")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="badges">Nhãn (phân cách bằng dấu phẩy)</Label>
            <Input
              id="badges"
              value={data.badges.join(", ")}
              onChange={(e) => patch({ badges: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
              placeholder="new, hot"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="allergens">Dị ứng (phân cách bằng dấu phẩy)</Label>
            <Input
              id="allergens"
              value={data.allergens.join(", ")}
              onChange={(e) => patch({ allergens: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
              placeholder="gluten, trứng, sữa"
            />
          </div>
          <div className="col-span-2 flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={data.is_featured} onCheckedChange={(c) => patch({ is_featured: c === true })} />
              Sản phẩm nổi bật
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={data.is_best_seller} onCheckedChange={(c) => patch({ is_best_seller: c === true })} />
              Bán chạy
            </label>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <Label>Hình ảnh</Label>
          <ImageUploader value={data.images} onChange={(images) => patch({ images })} folder="products" />
        </div>

        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <Label>Tuỳ chọn biến thể (size, vị...)</Label>
            <Button type="button" size="sm" variant="outline" onClick={addOption}>
              <Plus className="size-4" />
              Thêm nhóm tuỳ chọn
            </Button>
          </div>
          {data.options.map((option, optionIndex) => (
            <div key={optionIndex} className="space-y-3 rounded-md border p-3">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Khoá (vd: size)"
                  value={option.key}
                  onChange={(e) => updateOption(optionIndex, { key: e.target.value })}
                  className="w-32"
                />
                <Input
                  placeholder="Nhãn hiển thị (VI)"
                  value={option.label.vi}
                  onChange={(e) => updateOption(optionIndex, { label: { ...option.label, vi: e.target.value } })}
                />
                <Button type="button" size="icon" variant="ghost" onClick={() => removeOption(optionIndex)}>
                  <Trash2 className="text-destructive size-4" />
                </Button>
              </div>
              <div className="space-y-2 pl-4">
                {option.choices.map((choice, choiceIndex) => (
                  <div key={choiceIndex} className="flex items-center gap-2">
                    <Input
                      placeholder="Giá trị (vd: 20cm)"
                      value={choice.value}
                      onChange={(e) => updateChoice(optionIndex, choiceIndex, { value: e.target.value })}
                      className="w-28"
                    />
                    <Input
                      placeholder="Nhãn (VI)"
                      value={choice.label.vi}
                      onChange={(e) => updateChoice(optionIndex, choiceIndex, { label: { ...choice.label, vi: e.target.value } })}
                      className="w-32"
                    />
                    <Input
                      type="number"
                      placeholder="Chênh lệch giá (₫)"
                      value={choice.price_delta}
                      onChange={(e) => updateChoice(optionIndex, choiceIndex, { price_delta: Number(e.target.value) })}
                      className="w-36"
                    />
                    <Button type="button" size="icon" variant="ghost" onClick={() => removeChoice(optionIndex, choiceIndex)}>
                      <Trash2 className="text-destructive size-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" size="sm" variant="ghost" onClick={() => addChoice(optionIndex)}>
                  <Plus className="size-3.5" />
                  Thêm lựa chọn
                </Button>
              </div>
            </div>
          ))}
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

      <div className="lg:sticky lg:top-6 lg:self-start">
        <Label className="mb-3 block">Xem trước</Label>
        <ProductPreviewCard data={data} />
        <Separator className="my-4" />
        <div className="space-y-1.5">
          <Label htmlFor="slug">Đường dẫn (slug)</Label>
          <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="tự sinh nếu để trống" />
        </div>
      </div>
    </div>
  );
}
