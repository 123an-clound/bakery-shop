"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { AdminBannerRow } from "@/lib/bakery/admin/banners";
import { bannerDataSchema, type BannerData } from "@/lib/bakery/schemas";
import { createBanner, updateBanner } from "@/lib/actions/admin/banners";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUploader } from "@/components/admin/media/image-uploader";

const EMPTY: BannerData = { title: { vi: "" }, subtitle: { vi: "" }, image_url: "", image_mobile_url: "", href: "", cta_label: { vi: "" } };

export function BannerForm({ initial }: { initial?: AdminBannerRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<BannerData>(initial?.data ?? EMPTY);

  function patch(fields: Partial<BannerData>) {
    setData((prev) => ({ ...prev, ...fields }));
  }

  function save(status: "active" | "draft") {
    const parsed = bannerDataSchema.safeParse(data);
    if (!parsed.success) {
      toast.error("Cần có ít nhất ảnh desktop.");
      return;
    }
    startTransition(async () => {
      const result = initial
        ? await updateBanner(initial.id, { data: parsed.data, status })
        : await createBanner({ data: parsed.data, status });
      if (result.ok) {
        toast.success("Đã lưu banner.");
        router.push("/admin/banner");
        router.refresh();
      } else {
        toast.error("Có lỗi xảy ra.");
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
              <Label htmlFor="title-vi">Tiêu đề</Label>
              <Input id="title-vi" value={data.title?.vi ?? ""} onChange={(e) => patch({ title: { ...data.title, vi: e.target.value } })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subtitle-vi">Mô tả phụ</Label>
              <Input id="subtitle-vi" value={data.subtitle?.vi ?? ""} onChange={(e) => patch({ subtitle: { ...data.subtitle, vi: e.target.value } })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cta-vi">Nhãn nút CTA</Label>
              <Input id="cta-vi" value={data.cta_label?.vi ?? ""} onChange={(e) => patch({ cta_label: { ...data.cta_label, vi: e.target.value } })} />
            </div>
          </TabsContent>
          <TabsContent value="en" className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="title-en">Title</Label>
              <Input id="title-en" value={data.title?.en ?? ""} onChange={(e) => patch({ title: { vi: data.title?.vi ?? "", en: e.target.value } })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subtitle-en">Subtitle</Label>
              <Input
                id="subtitle-en"
                value={data.subtitle?.en ?? ""}
                onChange={(e) => patch({ subtitle: { vi: data.subtitle?.vi ?? "", en: e.target.value } })}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <Label>Ảnh desktop *</Label>
        <ImageUploader value={data.image_url ? [data.image_url] : []} onChange={(urls) => patch({ image_url: urls[0] ?? "" })} folder="banners" max={1} />
      </div>
      <div className="space-y-3 rounded-lg border p-4">
        <Label>Ảnh mobile (tuỳ chọn)</Label>
        <ImageUploader
          value={data.image_mobile_url ? [data.image_mobile_url] : []}
          onChange={(urls) => patch({ image_mobile_url: urls[0] ?? "" })}
          folder="banners"
          max={1}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
        <div className="space-y-1.5">
          <Label htmlFor="href">Đường dẫn khi bấm vào</Label>
          <Input id="href" value={data.href ?? ""} onChange={(e) => patch({ href: e.target.value })} placeholder="/san-pham" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="starts">Bắt đầu hiển thị</Label>
          <Input id="starts" type="date" value={data.starts_at?.slice(0, 10) ?? ""} onChange={(e) => patch({ starts_at: e.target.value || null })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ends">Kết thúc hiển thị</Label>
          <Input id="ends" type="date" value={data.ends_at?.slice(0, 10) ?? ""} onChange={(e) => patch({ ends_at: e.target.value || null })} />
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
