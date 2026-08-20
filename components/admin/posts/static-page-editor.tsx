"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { pageDataSchema, type PageData } from "@/lib/bakery/schemas";
import { updateStaticPage } from "@/lib/actions/admin/posts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const EMPTY: PageData = { title: { vi: "" }, content: { vi: "" } };

const PAGE_LABELS: Record<string, string> = {
  "gioi-thieu": "Giới thiệu",
  "chinh-sach-giao-hang": "Chính sách giao hàng",
  "dieu-khoan": "Điều khoản sử dụng",
};

function SinglePageEditor({ slug, initial }: { slug: string; initial: PageData | null }) {
  const [data, setData] = useState<PageData>(initial ?? EMPTY);
  const [isPending, startTransition] = useTransition();

  function patch(fields: Partial<PageData>) {
    setData((prev) => ({ ...prev, ...fields }));
  }

  function save() {
    const parsed = pageDataSchema.safeParse(data);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dữ liệu chưa hợp lệ.");
      return;
    }
    startTransition(async () => {
      const result = await updateStaticPage(slug, parsed.data);
      if (result.ok) toast.success("Đã lưu trang.");
      else toast.error("Có lỗi xảy ra.");
    });
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-1.5">
        <Label htmlFor={`title-${slug}`}>Tiêu đề (VI) *</Label>
        <Input id={`title-${slug}`} value={data.title.vi} onChange={(e) => patch({ title: { ...data.title, vi: e.target.value } })} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`content-${slug}`}>Nội dung (HTML, VI)</Label>
        <Textarea id={`content-${slug}`} rows={12} value={data.content?.vi ?? ""} onChange={(e) => patch({ content: { ...data.content, vi: e.target.value } })} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`title-en-${slug}`}>Title (EN)</Label>
        <Input id={`title-en-${slug}`} value={data.title.en ?? ""} onChange={(e) => patch({ title: { ...data.title, en: e.target.value } })} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`content-en-${slug}`}>Content (HTML, EN)</Label>
        <Textarea
          id={`content-en-${slug}`}
          rows={12}
          value={data.content?.en ?? ""}
          onChange={(e) => patch({ content: { vi: data.content?.vi ?? "", en: e.target.value } })}
        />
      </div>
      <Button disabled={isPending} onClick={save}>
        Lưu trang
      </Button>
    </div>
  );
}

export function StaticPageEditor({ pages }: { pages: { slug: string; data: PageData | null }[] }) {
  return (
    <Tabs defaultValue={pages[0]?.slug}>
      <TabsList>
        {pages.map((p) => (
          <TabsTrigger key={p.slug} value={p.slug}>
            {PAGE_LABELS[p.slug] ?? p.slug}
          </TabsTrigger>
        ))}
      </TabsList>
      {pages.map((p) => (
        <TabsContent key={p.slug} value={p.slug}>
          <SinglePageEditor slug={p.slug} initial={p.data} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
