"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { AdminCustomCakeRow } from "@/lib/bakery/admin/custom-cake";
import { quoteCustomCake, convertCustomCakeToOrder } from "@/lib/actions/admin/custom-cake";
import { CUSTOM_CAKE_STATUS_LABELS } from "@/lib/bakery/admin/labels";
import { formatDateTime, formatMoney } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CustomCakeDetail({ cake }: { cake: AdminCustomCakeRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [quotedPrice, setQuotedPrice] = useState(cake.data.quoted_price ?? 0);
  const [adminReply, setAdminReply] = useState(cake.data.admin_reply ?? "");

  const [addressLine, setAddressLine] = useState("");
  const [ward, setWard] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bank_transfer">("cod");
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleQuote() {
    startTransition(async () => {
      const result = await quoteCustomCake(cake.id, quotedPrice, adminReply);
      if (result.ok) {
        toast.success("Đã gửi báo giá cho khách.");
        router.refresh();
      } else {
        toast.error("Không gửi được báo giá.");
      }
    });
  }

  function handleConvert() {
    startTransition(async () => {
      const result = await convertCustomCakeToOrder(cake.id, {
        address: { line: addressLine, ward: ward || undefined, district: district || undefined, city },
        paymentMethod,
      });
      if (result.ok) {
        toast.success("Đã tạo đơn hàng.");
        setDialogOpen(false);
        router.push(`/admin/don-hang/${result.id}`);
      } else {
        toast.error(result.error === "not_quoted" ? "Cần báo giá trước khi chuyển thành đơn." : "Không tạo được đơn hàng.");
      }
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Chi tiết yêu cầu</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground text-xs">Kích thước</div>
              <div>{cake.data.size}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Số tầng</div>
              <div>{cake.data.layers}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Cốt bánh</div>
              <div>{cake.data.sponge}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Kem</div>
              <div>{cake.data.cream}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Vị</div>
              <div>{cake.data.flavor}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Tông màu</div>
              <div>{cake.data.color_theme || "—"}</div>
            </div>
            {cake.data.message_on_cake ? (
              <div className="col-span-2">
                <div className="text-muted-foreground text-xs">Chữ trên bánh</div>
                <div>{cake.data.message_on_cake}</div>
              </div>
            ) : null}
            {cake.data.budget ? (
              <div>
                <div className="text-muted-foreground text-xs">Ngân sách dự kiến</div>
                <div>{formatMoney(cake.data.budget)}</div>
              </div>
            ) : null}
            {cake.data.note ? (
              <div className="col-span-2">
                <div className="text-muted-foreground text-xs">Ghi chú</div>
                <div>{cake.data.note}</div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {cake.data.reference_images.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Ảnh mẫu</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-3">
              {cake.data.reference_images.map((url) => (
                <div key={url} className="relative size-28 overflow-hidden rounded-lg">
                  <Image src={url} alt="" fill sizes="112px" className="object-cover" />
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Báo giá</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="quoted-price">Giá báo (₫)</Label>
              <Input
                id="quoted-price"
                type="number"
                min={0}
                value={quotedPrice}
                onChange={(e) => setQuotedPrice(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-reply">Lời nhắn cho khách</Label>
              <Textarea id="admin-reply" rows={3} value={adminReply} onChange={(e) => setAdminReply(e.target.value)} />
            </div>
            <Button disabled={isPending} onClick={handleQuote}>
              Gửi báo giá
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {cake.data.customer_name}
              <Badge>{CUSTOM_CAKE_STATUS_LABELS[cake.status] ?? cake.status}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>{cake.data.phone}</div>
            {cake.data.email ? <div>{cake.data.email}</div> : null}
            <div className="text-muted-foreground text-xs">Cần lúc: {formatDateTime(cake.data.need_at)}</div>
            <div className="text-muted-foreground text-xs">Gửi lúc: {formatDateTime(cake.createdAt)}</div>
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" disabled={!cake.data.quoted_price}>
              Chuyển thành đơn hàng
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chuyển thành đơn hàng chính thức</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="addr-line">Số nhà, tên đường *</Label>
                <Input id="addr-line" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="addr-ward">Phường/Xã</Label>
                  <Input id="addr-ward" value={ward} onChange={(e) => setWard(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="addr-district">Quận/Huyện</Label>
                  <Input id="addr-district" value={district} onChange={(e) => setDistrict(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="addr-city">Tỉnh/Thành phố *</Label>
                <Input id="addr-city" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="payment">Phương thức thanh toán</Label>
                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "cod" | "bank_transfer")}>
                  <SelectTrigger id="payment" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cod">Thanh toán khi nhận hàng</SelectItem>
                    <SelectItem value="bank_transfer">Chuyển khoản</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button disabled={isPending || !addressLine || !city} onClick={handleConvert}>
                Tạo đơn hàng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
