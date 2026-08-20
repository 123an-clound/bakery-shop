import type { Metadata } from "next";

import { PostForm } from "@/components/admin/posts/post-form";

export const metadata: Metadata = { title: "Thêm bài viết" };

export default function NewPostPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Thêm bài viết</h1>
      <PostForm />
    </div>
  );
}
