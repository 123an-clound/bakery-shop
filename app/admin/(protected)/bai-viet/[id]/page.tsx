import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAdminPost } from "@/lib/bakery/admin/posts";
import { PostForm } from "@/components/admin/posts/post-form";

export const metadata: Metadata = { title: "Sửa bài viết" };

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const postId = Number(id);
  if (!Number.isInteger(postId)) notFound();

  const post = await getAdminPost(postId);
  if (!post) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Sửa bài viết</h1>
      <PostForm initial={post} />
    </div>
  );
}
