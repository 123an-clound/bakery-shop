"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

import type { AdminPostRow } from "@/lib/bakery/admin/posts";
import { deletePost } from "@/lib/actions/admin/posts";
import { CONTENT_STATUS_LABELS } from "@/lib/bakery/admin/labels";
import { formatDate } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function PostsClient({ posts }: { posts: AdminPostRow[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleDelete(id: number) {
    const result = await deletePost(id);
    if (result.ok) {
      toast.success("Đã xoá bài viết.");
      router.refresh();
    }
    setDeletingId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button asChild>
          <Link href="/admin/bai-viet/new">
            <Plus className="size-4" />
            Thêm bài viết
          </Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Ngày xuất bản</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell>
                  <Link href={`/admin/bai-viet/${post.id}`} className="font-medium hover:underline">
                    {post.data.title.vi}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">{post.data.tags.join(", ") || "—"}</TableCell>
                <TableCell>{post.data.published_at ? formatDate(post.data.published_at) : "—"}</TableCell>
                <TableCell>
                  <Badge variant={post.status === "active" ? "default" : "secondary"}>{CONTENT_STATUS_LABELS[post.status] ?? post.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/admin/bai-viet/${post.id}`} aria-label="Sửa bài viết">
                      <Pencil className="size-4" />
                    </Link>
                  </Button>
                  <AlertDialog open={deletingId === post.id} onOpenChange={(open) => setDeletingId(open ? post.id : null)}>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="text-destructive size-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Xoá bài viết &quot;{post.data.title.vi}&quot;?</AlertDialogTitle>
                        <AlertDialogDescription>Hành động này không thể hoàn tác.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Huỷ</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(post.id)}>Xoá</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
            {posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                  Chưa có bài viết nào.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
