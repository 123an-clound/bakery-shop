"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

import type { AdminCategoryRow } from "@/lib/bakery/admin/categories";
import { deleteCategory, reorderCategories } from "@/lib/actions/admin/categories";
import { CONTENT_STATUS_LABELS } from "@/lib/bakery/admin/labels";
import { t as tField } from "@/lib/i18n/text";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export function CategoriesClient({ categories }: { categories: AdminCategoryRow[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleDelete(id: number) {
    const result = await deleteCategory(id);
    if (result.ok) {
      toast.success("Đã xoá danh mục.");
      router.refresh();
    } else {
      toast.error(result.error ?? "Không xoá được danh mục.");
    }
    setDeletingId(null);
  }

  const columns: AdminTableColumn<AdminCategoryRow>[] = [
    {
      id: "thumbnail",
      header: "",
      cell: (row) =>
        row.data.image_url ? (
          <div className="relative size-10 overflow-hidden rounded-md">
            <Image src={row.data.image_url} alt="" fill sizes="40px" className="object-cover" />
          </div>
        ) : (
          <div className="bg-muted size-10 rounded-md" />
        ),
    },
    {
      id: "name",
      header: "Tên danh mục",
      cell: (row) => (
        <Link href={`/admin/danh-muc/${row.id}`} className="font-medium hover:underline">
          {tField(row.data.name, "vi")}
        </Link>
      ),
    },
    {
      id: "productCount",
      header: "Số sản phẩm",
      cell: (row) => row.productCount,
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: (row) => (
        <Badge variant={row.status === "active" ? "default" : "secondary"}>
          {CONTENT_STATUS_LABELS[row.status] ?? row.status}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/danh-muc/${row.id}`} aria-label="Sửa danh mục">
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
                <AlertDialogTitle>Xoá danh mục "{tField(row.data.name, "vi")}"?</AlertDialogTitle>
                <AlertDialogDescription>
                  {row.productCount > 0
                    ? `Danh mục này đang có ${row.productCount} sản phẩm — các sản phẩm sẽ không còn thuộc danh mục nào.`
                    : "Hành động này không thể hoàn tác."}
                </AlertDialogDescription>
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
          <Link href="/admin/danh-muc/new">
            <Plus className="size-4" />
            Thêm danh mục
          </Link>
        </Button>
      </div>
      <SortableDataTable
        columns={columns}
        data={categories}
        getRowId={(c) => String(c.id)}
        onReorder={async (ids) => {
          await reorderCategories(ids.map(Number));
        }}
        emptyMessage="Chưa có danh mục nào."
      />
    </div>
  );
}
