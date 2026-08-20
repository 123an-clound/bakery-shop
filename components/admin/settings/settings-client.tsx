"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";

import type { SettingSiteData } from "@/lib/bakery/schemas";
import { saveSiteSettings, saveNotifyEmails, sendTestEmail } from "@/lib/actions/admin/settings";
import { buildVietQrUrl } from "@/lib/vietqr";
import { VIETQR_BANKS } from "@/lib/vietqr-banks";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ShopFields = Omit<SettingSiteData, "brand_name" | "tagline" | "logo_url" | "favicon_url">;

export function SettingsClient({ initial, initialNotifyEmails }: { initial: ShopFields; initialNotifyEmails: string[] }) {
  const [data, setData] = useState<ShopFields>(initial);
  const [notifyEmails, setNotifyEmails] = useState(initialNotifyEmails.join(", "));
  const [testEmailTo, setTestEmailTo] = useState("");
  const [showQrPreview, setShowQrPreview] = useState(false);
  const [isPending, startTransition] = useTransition();

  function patch(fields: Partial<ShopFields>) {
    setData((prev) => ({ ...prev, ...fields }));
  }

  function saveShopInfo() {
    startTransition(async () => {
      const result = await saveSiteSettings(data);
      if (result.ok) toast.success("Đã lưu thông tin tiệm.");
      else toast.error("Có lỗi xảy ra.");
    });
  }

  function saveEmails() {
    startTransition(async () => {
      const emails = notifyEmails.split(",").map((s) => s.trim()).filter(Boolean);
      const result = await saveNotifyEmails(emails);
      if (result.ok) toast.success("Đã lưu danh sách email nhận thông báo.");
    });
  }

  function handleSendTest() {
    if (!testEmailTo) return;
    startTransition(async () => {
      const result = await sendTestEmail(testEmailTo);
      if (result.ok) toast.success("Đã gửi email thử.");
      else toast.error(result.error ?? "Chưa cấu hình RESEND_API_KEY — xem console server.");
    });
  }

  const bank = data.bank;
  const qrUrl =
    bank?.bank_code && bank.account_number
      ? buildVietQrUrl({
          bankCode: bank.bank_code,
          accountNumber: bank.account_number,
          accountName: bank.account_name || "TEN CHU TAI KHOAN",
          amount: 100000,
          addInfo: `${bank.transfer_note_prefix || "TEST"} 000000`,
        })
      : null;

  return (
    <Tabs defaultValue="shop">
      <TabsList>
        <TabsTrigger value="shop">Thông tin tiệm</TabsTrigger>
        <TabsTrigger value="bank">Ngân hàng</TabsTrigger>
        <TabsTrigger value="shipping">Vận chuyển</TabsTrigger>
        <TabsTrigger value="email">Email</TabsTrigger>
        <TabsTrigger value="seo">SEO</TabsTrigger>
      </TabsList>

      <TabsContent value="shop" className="max-w-xl space-y-4 pt-4">
        <div className="space-y-1.5">
          <Label htmlFor="hotline">Hotline</Label>
          <Input id="hotline" value={data.hotline ?? ""} onChange={(e) => patch({ hotline: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email liên hệ</Label>
          <Input id="email" type="email" value={data.email ?? ""} onChange={(e) => patch({ email: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address">Địa chỉ</Label>
          <Input id="address" value={data.address?.vi ?? ""} onChange={(e) => patch({ address: { ...data.address, vi: e.target.value } })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="opening-hours">Giờ mở cửa</Label>
          <Input id="opening-hours" value={data.opening_hours?.vi ?? ""} onChange={(e) => patch({ opening_hours: { ...data.opening_hours, vi: e.target.value } })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="map-embed">Nhúng bản đồ (iframe URL hoặc mã nhúng)</Label>
          <Textarea id="map-embed" rows={2} value={data.map_embed ?? ""} onChange={(e) => patch({ map_embed: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="facebook">Facebook</Label>
            <Input id="facebook" value={data.socials?.facebook ?? ""} onChange={(e) => patch({ socials: { ...data.socials, facebook: e.target.value } })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="instagram">Instagram</Label>
            <Input id="instagram" value={data.socials?.instagram ?? ""} onChange={(e) => patch({ socials: { ...data.socials, instagram: e.target.value } })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tiktok">TikTok</Label>
            <Input id="tiktok" value={data.socials?.tiktok ?? ""} onChange={(e) => patch({ socials: { ...data.socials, tiktok: e.target.value } })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="zalo">Zalo</Label>
            <Input id="zalo" value={data.socials?.zalo ?? ""} onChange={(e) => patch({ socials: { ...data.socials, zalo: e.target.value } })} />
          </div>
        </div>
        <Button disabled={isPending} onClick={saveShopInfo}>
          Lưu thông tin tiệm
        </Button>
      </TabsContent>

      <TabsContent value="bank" className="max-w-xl space-y-4 pt-4">
        <div className="space-y-1.5">
          <Label htmlFor="bank-code">Ngân hàng</Label>
          <Select
            value={bank?.bank_code ?? ""}
            onValueChange={(v) => {
              const selected = VIETQR_BANKS.find((b) => b.code === v);
              patch({ bank: { bank_code: v, bank_name: selected?.name ?? "", account_number: bank?.account_number ?? "", account_name: bank?.account_name ?? "", transfer_note_prefix: bank?.transfer_note_prefix ?? "" } });
            }}
          >
            <SelectTrigger id="bank-code" className="w-full">
              <SelectValue placeholder="Chọn ngân hàng" />
            </SelectTrigger>
            <SelectContent>
              {VIETQR_BANKS.map((b) => (
                <SelectItem key={b.code} value={b.code}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="account-number">Số tài khoản</Label>
          <Input
            id="account-number"
            value={bank?.account_number ?? ""}
            onChange={(e) => patch({ bank: { bank_code: bank?.bank_code ?? "", bank_name: bank?.bank_name ?? "", account_number: e.target.value, account_name: bank?.account_name ?? "", transfer_note_prefix: bank?.transfer_note_prefix ?? "" } })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="account-name">Tên chủ tài khoản</Label>
          <Input
            id="account-name"
            value={bank?.account_name ?? ""}
            onChange={(e) => patch({ bank: { bank_code: bank?.bank_code ?? "", bank_name: bank?.bank_name ?? "", account_number: bank?.account_number ?? "", account_name: e.target.value, transfer_note_prefix: bank?.transfer_note_prefix ?? "" } })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="note-prefix">Tiền tố nội dung chuyển khoản</Label>
          <Input
            id="note-prefix"
            value={bank?.transfer_note_prefix ?? ""}
            onChange={(e) => patch({ bank: { bank_code: bank?.bank_code ?? "", bank_name: bank?.bank_name ?? "", account_number: bank?.account_number ?? "", account_name: bank?.account_name ?? "", transfer_note_prefix: e.target.value } })}
            placeholder="VD: TIEMBANH"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button disabled={isPending} onClick={saveShopInfo}>
            Lưu thông tin ngân hàng
          </Button>
          <Button type="button" variant="outline" disabled={!qrUrl} onClick={() => setShowQrPreview((v) => !v)}>
            Xem thử mã QR
          </Button>
        </div>
        {showQrPreview && qrUrl ? (
          <Card className="w-fit">
            <CardContent className="flex flex-col items-center gap-2 pt-6">
              {/* eslint-disable-next-line @next/next/no-img-element -- external VietQR image */}
              <img src={qrUrl} alt="VietQR preview" width={200} height={200} />
              <p className="text-muted-foreground text-xs">Mã QR thử với số tiền 100.000₫</p>
            </CardContent>
          </Card>
        ) : null}
      </TabsContent>

      <TabsContent value="shipping" className="max-w-xl space-y-4 pt-4">
        <div className="space-y-1.5">
          <Label htmlFor="shipping-fee">Phí vận chuyển (₫)</Label>
          <Input
            id="shipping-fee"
            type="number"
            min={0}
            value={data.shipping?.fee ?? 0}
            onChange={(e) => patch({ shipping: { fee: Number(e.target.value), free_from: data.shipping?.free_from ?? 0, note: data.shipping?.note } })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="free-from">Miễn phí ship từ (₫)</Label>
          <Input
            id="free-from"
            type="number"
            min={0}
            value={data.shipping?.free_from ?? 0}
            onChange={(e) => patch({ shipping: { fee: data.shipping?.fee ?? 0, free_from: Number(e.target.value), note: data.shipping?.note } })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="shipping-note">Ghi chú vận chuyển</Label>
          <Textarea
            id="shipping-note"
            rows={2}
            value={data.shipping?.note?.vi ?? ""}
            onChange={(e) => patch({ shipping: { fee: data.shipping?.fee ?? 0, free_from: data.shipping?.free_from ?? 0, note: { ...data.shipping?.note, vi: e.target.value } } })}
          />
        </div>
        <Button disabled={isPending} onClick={saveShopInfo}>
          Lưu vận chuyển
        </Button>
      </TabsContent>

      <TabsContent value="email" className="max-w-xl space-y-4 pt-4">
        <div className="space-y-1.5">
          <Label htmlFor="notify-emails">Email nhận thông báo đơn mới (phân cách bằng dấu phẩy)</Label>
          <Textarea id="notify-emails" rows={2} value={notifyEmails} onChange={(e) => setNotifyEmails(e.target.value)} />
        </div>
        <Button disabled={isPending} onClick={saveEmails}>
          Lưu danh sách email
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gửi email thử</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="test-email">Gửi tới</Label>
              <Input id="test-email" type="email" value={testEmailTo} onChange={(e) => setTestEmailTo(e.target.value)} />
            </div>
            <Button type="button" variant="outline" disabled={isPending || !testEmailTo} onClick={handleSendTest}>
              Gửi email thử
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="seo" className="max-w-xl space-y-4 pt-4">
        <div className="space-y-1.5">
          <Label htmlFor="seo-title">Tiêu đề mặc định</Label>
          <Input id="seo-title" value={data.seo?.title?.vi ?? ""} onChange={(e) => patch({ seo: { ...data.seo, title: { ...data.seo?.title, vi: e.target.value } } })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="seo-desc">Mô tả mặc định</Label>
          <Textarea id="seo-desc" rows={3} value={data.seo?.description?.vi ?? ""} onChange={(e) => patch({ seo: { ...data.seo, description: { ...data.seo?.description, vi: e.target.value } } })} />
        </div>
        <div className="space-y-3">
          <Label>Ảnh Open Graph</Label>
          {data.seo?.og_image ? (
            <div className="relative h-32 w-56 overflow-hidden rounded-lg border">
              <Image src={data.seo.og_image} alt="" fill sizes="224px" className="object-cover" />
            </div>
          ) : null}
          <Input
            value={data.seo?.og_image ?? ""}
            onChange={(e) => patch({ seo: { ...data.seo, og_image: e.target.value } })}
            placeholder="https://..."
          />
        </div>
        <Button disabled={isPending} onClick={saveShopInfo}>
          Lưu SEO
        </Button>
      </TabsContent>
    </Tabs>
  );
}
