"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { AdminPostRow } from "@/lib/bakery/admin/posts";
import { postDataSchema, type PostData } from "@/lib/bakery/schemas";
import { createPost, updatePost } from "@/lib/actions/admin/posts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUploader } from "@/components/admin/media/image-uploader";

const EMPTY: PostData = { title: { vi: "" }, excerpt: { vi: "" }, content: { vi: "" }, cover_url: "", author: "Admin", tags: [] };

export function PostForm({ initial }: { initial?: AdminPostRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<PostData>(initial?.data ?? EMPTY);
  const [slug, setSlug] = useState(initial?.slug ?? "");

  function patch(fields: Partial<PostData>) {
    setData((prev) => ({ ...prev, ...fields }));
  }

  function save(status: "active" | "draft") {
    const parsed = postDataSchema.safeParse({
      ...data,
      published_at: status === "active" && !data.published_at ? new Date().toISOString() : data.published_at,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dữ liệu chưa hợp lệ.");
      return;
    }
    startTransition(async () => {
      const input = { data: parsed.data, status, slug: slug || undefined };
      const result = initial ? await updatePost(initial.id, input) : await createPost(input);
      if (result.ok) {
        toast.success(status === "active" ? "Đã xuất bản bài viết." : "Đã lưu nháp.");
        router.push("/admin/bai-viet");
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
              <Label htmlFor="title-vi">Tiêu đề *</Label>
              <Input id="title-vi" value={data.title.vi} onChange={(e) => patch({ title: { ...data.title, vi: e.target.value } })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="excerpt-vi">Tóm tắt</Label>
              <Input id="excerpt-vi" value={data.excerpt?.vi ?? ""} onChange={(e) => patch({ excerpt: { ...data.excerpt, vi: e.target.value } })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="content-vi">Nội dung (HTML)</Label>
              <Textarea id="content-vi" rows={10} value={data.content.vi} onChange={(e) => patch({ content: { ...data.content, vi: e.target.value } })} />
            </div>
          </TabsContent>
          <TabsContent value="en" className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="title-en">Title</Label>
              <Input id="title-en" value={data.title.en ?? ""} onChange={(e) => patch({ title: { ...data.title, en: e.target.value } })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="content-en">Content (HTML)</Label>
              <Textarea
                id="content-en"
                rows={10}
                value={data.content.en ?? ""}
                onChange={(e) => patch({ content: { vi: data.content.vi, en: e.target.value } })}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <Label>Ảnh bìa</Label>
        <ImageUploader value={data.cover_url ? [data.cover_url] : []} onChange={(urls) => patch({ cover_url: urls[0] ?? "" })} folder="posts" max={1} />
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
        <div className="space-y-1.5">
          <Label htmlFor="tags">Tags (phân cách bằng dấu phẩy)</Label>
          <Input
            id="tags"
            value={data.tags.join(", ")}
            onChange={(e) => patch({ tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="published-at">Ngày xuất bản</Label>
          <Input
            id="published-at"
            type="datetime-local"
            value={data.published_at?.slice(0, 16) ?? ""}
            onChange={(e) => patch({ published_at: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
          />
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
