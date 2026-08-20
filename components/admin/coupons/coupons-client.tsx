"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

import type { AdminCouponRow } from "@/lib/bakery/admin/coupons";
import { couponDataSchema, type CouponData } from "@/lib/bakery/schemas";
import { createCoupon, updateCoupon, deleteCoupon } from "@/lib/actions/admin/coupons";
import { COUPON_STATUS_LABELS } from "@/lib/bakery/admin/labels";
import { formatDate, formatMoney } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

const EMPTY: CouponData = {
  code: "",
  discount_type: "percent",
  value: 10,
  max_discount: null,
  min_order: 0,
  usage_limit: null,
  used_count: 0,
  starts_at: null,
  ends_at: null,
  description: { vi: "" },
};

function CouponDialog({
  coupon,
  open,
  onOpenChange,
  onSaved,
}: {
  coupon?: AdminCouponRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [data, setData] = useState<CouponData>(coupon?.data ?? EMPTY);
  const [status, setStatus] = useState<"active" | "expired" | "disabled">(
    (coupon?.status as "active" | "expired" | "disabled") ?? "active",
  );
  const [isPending, startTransition] = useTransition();

  function patch(fields: Partial<CouponData>) {
    setData((prev) => ({ ...prev, ...fields }));
  }

  function handleSave() {
    const parsed = couponDataSchema.safeParse(data);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dữ liệu chưa hợp lệ.");
      return;
    }
    startTransition(async () => {
      const result = coupon
        ? await updateCoupon(coupon.id, { data: parsed.data, status })
        : await createCoupon({ data: parsed.data, status });
      if (result.ok) {
        toast.success("Đã lưu mã giảm giá.");
        onOpenChange(false);
        onSaved();
      } else {
        toast.error(result.error === "code_taken" ? "Mã này đã tồn tại." : "Có lỗi xảy ra.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{coupon ? "Sửa mã giảm giá" : "Thêm mã giảm giá"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="code">Mã *</Label>
            <Input id="code" value={data.code} onChange={(e) => patch({ code: e.target.value.toUpperCase() })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="discount-type">Loại giảm</Label>
              <Select value={data.discount_type} onValueChange={(v) => patch({ discount_type: v as "percent" | "fixed" })}>
                <SelectTrigger id="discount-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Phần trăm (%)</SelectItem>
                  <SelectItem value="fixed">Số tiền cố định (₫)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="value">Giá trị</Label>
              <Input id="value" type="number" min={0} value={data.value} onChange={(e) => patch({ value: Number(e.target.value) })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="max-discount">Giảm tối đa (₫)</Label>
              <Input
                id="max-discount"
                type="number"
                min={0}
                value={data.max_discount ?? ""}
                onChange={(e) => patch({ max_discount: e.target.value ? Number(e.target.value) : null })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="min-order">Đơn tối thiểu (₫)</Label>
              <Input id="min-order" type="number" min={0} value={data.min_order} onChange={(e) => patch({ min_order: Number(e.target.value) })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="usage-limit">Giới hạn lượt dùng</Label>
              <Input
                id="usage-limit"
                type="number"
                min={0}
                value={data.usage_limit ?? ""}
                onChange={(e) => patch({ usage_limit: e.target.value ? Number(e.target.value) : null })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Trạng thái</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Đang hoạt động</SelectItem>
                  <SelectItem value="expired">Hết hạn</SelectItem>
                  <SelectItem value="disabled">Đã tắt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="starts-at">Bắt đầu</Label>
              <Input
                id="starts-at"
                type="date"
                value={data.starts_at?.slice(0, 10) ?? ""}
                onChange={(e) => patch({ starts_at: e.target.value || null })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ends-at">Kết thúc</Label>
              <Input
                id="ends-at"
                type="date"
                value={data.ends_at?.slice(0, 10) ?? ""}
                onChange={(e) => patch({ ends_at: e.target.value || null })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Mô tả</Label>
            <Input
              id="description"
              value={data.description?.vi ?? ""}
              onChange={(e) => patch({ description: { ...data.description, vi: e.target.value } })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button disabled={isPending} onClick={handleSave}>
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CouponsClient({ coupons }: { coupons: AdminCouponRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<AdminCouponRow | undefined>();
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleDelete(id: number) {
    const result = await deleteCoupon(id);
    if (result.ok) {
      toast.success("Đã xoá mã giảm giá.");
      router.refresh();
    }
    setDeletingId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          Thêm mã giảm giá
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã</TableHead>
              <TableHead>Giá trị</TableHead>
              <TableHead>Đơn tối thiểu</TableHead>
              <TableHead>Đã dùng</TableHead>
              <TableHead>Hết hạn</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono font-medium">{c.data.code}</TableCell>
                <TableCell>{c.data.discount_type === "percent" ? `${c.data.value}%` : formatMoney(c.data.value)}</TableCell>
                <TableCell>{formatMoney(c.data.min_order)}</TableCell>
                <TableCell>
                  {c.data.used_count}
                  {c.data.usage_limit ? ` / ${c.data.usage_limit}` : ""}
                </TableCell>
                <TableCell>{c.data.ends_at ? formatDate(c.data.ends_at) : "—"}</TableCell>
                <TableCell>
                  <Badge variant={c.status === "active" ? "default" : "secondary"}>{COUPON_STATUS_LABELS[c.status] ?? c.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => setEditing(c)}>
                    <Pencil className="size-4" />
                  </Button>
                  <AlertDialog open={deletingId === c.id} onOpenChange={(open) => setDeletingId(open ? c.id : null)}>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="text-destructive size-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Xoá mã "{c.data.code}"?</AlertDialogTitle>
                        <AlertDialogDescription>Hành động này không thể hoàn tác.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Huỷ</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(c.id)}>Xoá</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
            {coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground py-8 text-center">
                  Chưa có mã giảm giá nào.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <CouponDialog open={creating} onOpenChange={setCreating} onSaved={() => router.refresh()} />
      {editing ? (
        <CouponDialog coupon={editing} open={!!editing} onOpenChange={(open) => !open && setEditing(undefined)} onSaved={() => router.refresh()} />
      ) : null}
    </div>
  );
}
