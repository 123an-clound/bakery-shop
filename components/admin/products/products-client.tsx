"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Plus } from "lucide-react";

import type { AdminProductRow } from "@/lib/bakery/admin/products";
import type { AdminCategoryRow } from "@/lib/bakery/admin/categories";
import {
  bulkDeleteProducts,
  bulkSetProductStatus,
  reorderProducts,
  toggleProductFeatured,
} from "@/lib/actions/admin/products";
import { CONTENT_STATUS_LABELS } from "@/lib/bakery/admin/labels";
import { formatMoney } from "@/lib/utils/format";
import { t as tField } from "@/lib/i18n/text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SortableDataTable, type AdminTableColumn } from "@/components/admin/sortable-data-table";

export function ProductsClient({
  products,
  categories,
}: {
  products: AdminProductRow[];
  categories: AdminCategoryRow[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [, startTransition] = useTransition();

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (search && !tField(p.data.name, "vi").toLowerCase().includes(search.toLowerCase())) return false;
      if (categoryFilter !== "all" && String(p.categoryId) !== categoryFilter) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      return true;
    });
  }, [products, search, categoryFilter, statusFilter]);

  function toggleSelect(id: number, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleBulkDelete() {
    const ids = [...selected];
    const result = await bulkDeleteProducts(ids);
    if (result.ok) {
      toast.success(`Đã xoá ${ids.length} sản phẩm.`);
      setSelected(new Set());
      router.refresh();
    } else {
      toast.error("Không xoá được.");
    }
  }

  async function handleBulkStatus(status: "active" | "draft" | "archived") {
    const ids = [...selected];
    const result = await bulkSetProductStatus(ids, status);
    if (result.ok) {
      toast.success(`Đã cập nhật trạng thái ${ids.length} sản phẩm.`);
      setSelected(new Set());
      router.refresh();
    } else {
      toast.error("Không cập nhật được.");
    }
  }

  const columns: AdminTableColumn<AdminProductRow>[] = [
    {
      id: "select",
      header: null,
      cell: (row) => (
        <Checkbox
          checked={selected.has(row.id)}
          onCheckedChange={(checked) => toggleSelect(row.id, checked === true)}
          aria-label="Chọn sản phẩm"
        />
      ),
    },
    {
      id: "thumbnail",
      header: "",
      cell: (row) => {
        const image = row.data.images[0];
        return image ? (
          <div className="relative size-10 overflow-hidden rounded-md">
            <Image src={image} alt="" fill sizes="40px" className="object-cover" />
          </div>
        ) : (
          <div className="bg-muted size-10 rounded-md" />
        );
      },
    },
    {
      id: "name",
      header: "Tên sản phẩm",
      cell: (row) => (
        <Link href={`/admin/san-pham/${row.id}`} className="font-medium hover:underline">
          {tField(row.data.name, "vi")}
        </Link>
      ),
    },
    {
      id: "category",
      header: "Danh mục",
      cell: (row) => {
        const category = row.categoryId !== null ? categoryById.get(row.categoryId) : undefined;
        return category ? tField(category.data.name, "vi") : "—";
      },
    },
    {
      id: "price",
      header: "Giá",
      cell: (row) => (
        <div>
          {formatMoney(row.data.sale_price ?? row.data.price)}
          {row.data.sale_price ? (
            <div className="text-muted-foreground text-xs line-through">{formatMoney(row.data.price)}</div>
          ) : null}
        </div>
      ),
    },
    {
      id: "stock",
      header: "Tồn kho",
      cell: (row) => row.data.stock ?? "—",
    },
    {
      id: "featured",
      header: "Nổi bật",
      cell: (row) => (
        <Switch
          checked={row.data.is_featured}
          onCheckedChange={(checked) => {
            startTransition(async () => {
              const result = await toggleProductFeatured(row.id, row.data, checked);
              if (result.ok) router.refresh();
            });
          }}
        />
      ),
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
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/san-pham/${row.id}`} aria-label="Sửa sản phẩm">
            <MoreHorizontal className="size-4" />
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Tìm sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-56"
          />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-9 w-44">
              <SelectValue placeholder="Danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả danh mục</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {tField(c.data.name, "vi")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-40">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="active">Đã xuất bản</SelectItem>
              <SelectItem value="draft">Nháp</SelectItem>
              <SelectItem value="archived">Lưu trữ</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button asChild>
          <Link href="/admin/san-pham/new">
            <Plus className="size-4" />
            Thêm sản phẩm
          </Link>
        </Button>
      </div>

      {selected.size > 0 ? (
        <div className="bg-accent flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
          <span>{selected.size} sản phẩm đã chọn</span>
          <Button size="sm" variant="outline" onClick={() => handleBulkStatus("draft")}>
            Chuyển nháp
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleBulkStatus("active")}>
            Xuất bản
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive">
                Xoá
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xoá {selected.size} sản phẩm?</AlertDialogTitle>
                <AlertDialogDescription>Hành động này không thể hoàn tác.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Huỷ</AlertDialogCancel>
                <AlertDialogAction onClick={handleBulkDelete}>Xoá</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : null}

      <SortableDataTable
        columns={columns}
        data={filtered}
        getRowId={(p) => String(p.id)}
        onReorder={async (ids) => {
          await reorderProducts(ids.map(Number));
        }}
        emptyMessage="Không tìm thấy sản phẩm nào."
      />
    </div>
  );
}
