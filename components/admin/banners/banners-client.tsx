"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

import type { AdminBannerRow } from "@/lib/bakery/admin/banners";
import { deleteBanner, reorderBanners } from "@/lib/actions/admin/banners";
import { CONTENT_STATUS_LABELS } from "@/lib/bakery/admin/labels";
import { t as tField } from "@/lib/i18n/text";
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
import { SortableDataTable, type AdminTableColumn } from "@/components/admin/sortable-data-table";

export function BannersClient({ banners }: { banners: AdminBannerRow[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleDelete(id: number) {
    const result = await deleteBanner(id);
    if (result.ok) {
      toast.success("Đã xoá banner.");
      router.refresh();
    }
    setDeletingId(null);
  }

  const columns: AdminTableColumn<AdminBannerRow>[] = [
    {
      id: "thumbnail",
      header: "",
      cell: (row) => (
        <div className="relative h-10 w-16 overflow-hidden rounded-md">
          <Image src={row.data.image_url} alt="" fill sizes="64px" className="object-cover" />
        </div>
      ),
    },
    {
      id: "title",
      header: "Tiêu đề",
      cell: (row) => (
        <Link href={`/admin/banner/${row.id}`} className="font-medium hover:underline">
          {row.data.title ? tField(row.data.title, "vi") : `Banner #${row.id}`}
        </Link>
      ),
    },
    {
      id: "period",
      header: "Thời gian hiệu lực",
      cell: (row) =>
        row.data.starts_at || row.data.ends_at
          ? `${row.data.starts_at?.slice(0, 10) ?? "..."} → ${row.data.ends_at?.slice(0, 10) ?? "..."}`
          : "Luôn hiển thị",
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: (row) => <Badge variant={row.status === "active" ? "default" : "secondary"}>{CONTENT_STATUS_LABELS[row.status] ?? row.status}</Badge>,
    },
    {
      id: "actions",
      header: "",
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/banner/${row.id}`} aria-label="Sửa banner">
              <Pencil className="size-4" />
            </Link>
          </Button>
          <AlertDialog open={deletingId === row.id} onOpenChange={(open) => setDeletingId(open ? row.id : null)}>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Trash2 className="text-destructive size-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xoá banner này?</AlertDialogTitle>
                <AlertDialogDescription>Hành động này không thể hoàn tác.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Huỷ</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(row.id)}>Xoá</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button asChild>
          <Link href="/admin/banner/new">
            <Plus className="size-4" />
            Thêm banner
          </Link>
        </Button>
      </div>
      <SortableDataTable
        columns={columns}
        data={banners}
        getRowId={(b) => String(b.id)}
        onReorder={async (ids) => {
          await reorderBanners(ids.map(Number));
        }}
        emptyMessage="Chưa có banner nào."
      />
    </div>
  );
}
