import type { Metadata } from "next";
import Link from "next/link";

import { listAdminPosts } from "@/lib/bakery/admin/posts";
import { PostsClient } from "@/components/admin/posts/posts-client";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Bài viết" };

export default async function AdminPostsPage() {
  const posts = await listAdminPosts();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Bài viết</h1>
        <Button variant="outline" asChild>
          <Link href="/admin/trang-tinh">Sửa trang tĩnh</Link>
        </Button>
      </div>
      <PostsClient posts={posts} />
    </div>
  );
}
