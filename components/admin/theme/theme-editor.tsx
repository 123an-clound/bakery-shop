"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { RotateCcw, Save } from "lucide-react";

import type { ThemeData, SettingSiteData } from "@/lib/bakery/schemas";
import { themeDataSchema } from "@/lib/bakery/schemas";
import { saveTheme, saveBrandSettings, resetThemeToDefault } from "@/lib/actions/admin/theme";
import { THEME_PRESETS } from "@/lib/theme/presets";
import { FONT_OPTIONS } from "@/lib/theme/fonts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { ImageUploader } from "@/components/admin/media/image-uploader";
import { SectionsPanel } from "./sections-panel";

const COLOR_LABELS: Record<keyof ThemeData["colors"], string> = {
  primary: "Chính (Primary)",
  secondary: "Phụ (Secondary)",
  accent: "Nhấn (Accent)",
  background: "Nền",
  foreground: "Chữ",
  muted: "Nền mờ (Muted)",
  success: "Thành công",
  destructive: "Cảnh báo/Lỗi",
};

const HERO_VARIANTS = [
  { value: "pastel-3d", label: "Pastel 3D" },
  { value: "image-full", label: "Ảnh toàn màn hình" },
  { value: "video", label: "Video" },
  { value: "split", label: "Chia đôi" },
];

function radiusRemToSlider(radius: string): number {
  const parsed = parseFloat(radius);
  return Number.isFinite(parsed) ? parsed : 1.5;
}

export function ThemeEditor({
  initialTheme,
  initialBrand,
}: {
  initialTheme: ThemeData;
  initialBrand: { brandName: SettingSiteData["brand_name"]; tagline?: SettingSiteData["tagline"]; logoUrl?: string; faviconUrl?: string };
}) {
  const [theme, setTheme] = useState<ThemeData>(initialTheme);
  const [brand, setBrand] = useState(initialBrand);
  const [isPending, startTransition] = useTransition();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  function patchTheme(fields: Partial<ThemeData>) {
    setTheme((prev) => ({ ...prev, ...fields }));
  }

  // Live, unsaved preview — postMessage into the iframe (mục 9.6 intro).
  useEffect(() => {
    const target = window.location.origin;
    iframeRef.current?.contentWindow?.postMessage(
      { type: "bakery-theme-preview", colors: theme.colors, radius: theme.radius, fonts: theme.fonts },
      target,
    );
  }, [theme.colors, theme.radius, theme.fonts]);

  function handleSaveTheme() {
    const parsed = themeDataSchema.safeParse(theme);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dữ liệu chưa hợp lệ.");
      return;
    }
    startTransition(async () => {
      const [themeResult, brandResult] = await Promise.all([
        saveTheme(parsed.data),
        saveBrandSettings({ brandName: brand.brandName, tagline: brand.tagline, logoUrl: brand.logoUrl, faviconUrl: brand.faviconUrl }),
      ]);
      if (themeResult.ok && brandResult.ok) {
        toast.success("Đã lưu thay đổi — site khách cập nhật ngay.");
        iframeRef.current?.contentWindow?.location.reload();
      } else {
        toast.error("Có lỗi xảy ra khi lưu.");
      }
    });
  }

  function handleReset() {
    startTransition(async () => {
      const result = await resetThemeToDefault();
      if (result.ok) {
        toast.success("Đã khôi phục giao diện mặc định.");
        window.location.reload();
      }
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
      <div className="max-h-[calc(100vh-8rem)] space-y-6 overflow-y-auto pr-2">
        <div className="space-y-3 rounded-lg border p-4">
          <h2 className="font-semibold">Thương hiệu</h2>
          <div className="space-y-1.5">
            <Label htmlFor="brand-name">Tên tiệm (VI)</Label>
            <Input
              id="brand-name"
              value={brand.brandName.vi}
              onChange={(e) => setBrand((prev) => ({ ...prev, brandName: { ...prev.brandName, vi: e.target.value } }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="brand-name-en">Tên tiệm (EN)</Label>
            <Input
              id="brand-name-en"
              value={brand.brandName.en ?? ""}
              onChange={(e) => setBrand((prev) => ({ ...prev, brandName: { ...prev.brandName, en: e.target.value } }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tagline">Slogan (VI)</Label>
            <Input
              id="tagline"
              value={brand.tagline?.vi ?? ""}
              onChange={(e) => setBrand((prev) => ({ ...prev, tagline: { ...prev.tagline, vi: e.target.value } }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Logo</Label>
            <ImageUploader
              value={brand.logoUrl ? [brand.logoUrl] : []}
              onChange={(urls) => setBrand((prev) => ({ ...prev, logoUrl: urls[0] ?? "" }))}
              folder="theme"
              max={1}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Favicon</Label>
            <ImageUploader
              value={brand.faviconUrl ? [brand.faviconUrl] : []}
              onChange={(urls) => setBrand((prev) => ({ ...prev, faviconUrl: urls[0] ?? "" }))}
              folder="theme"
              max={1}
            />
          </div>
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <h2 className="font-semibold">Bảng màu</h2>
          <div className="flex flex-wrap gap-2">
            {THEME_PRESETS.map((preset) => (
              <Button key={preset.name} type="button" size="sm" variant="outline" onClick={() => patchTheme({ colors: preset.colors })}>
                {preset.name}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(theme.colors) as (keyof ThemeData["colors"])[]).map((key) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={`color-${key}`} className="text-xs">
                  {COLOR_LABELS[key]}
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    id={`color-${key}`}
                    type="color"
                    value={theme.colors[key]}
                    onChange={(e) => patchTheme({ colors: { ...theme.colors, [key]: e.target.value } })}
                    className="h-8 w-10 shrink-0 cursor-pointer rounded border"
                  />
                  <Input
                    id={`color-hex-${key}`}
                    aria-label={`${COLOR_LABELS[key]} (mã hex)`}
                    value={theme.colors[key]}
                    onChange={(e) => patchTheme({ colors: { ...theme.colors, [key]: e.target.value } })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <h2 className="font-semibold">Font chữ</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="font-heading">Tiêu đề</Label>
              <Select value={theme.fonts.heading} onValueChange={(v) => patchTheme({ fonts: { ...theme.fonts, heading: v } })}>
                <SelectTrigger id="font-heading" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="font-body">Nội dung</Label>
              <Select value={theme.fonts.body} onValueChange={(v) => patchTheme({ fonts: { ...theme.fonts, body: v } })}>
                <SelectTrigger id="font-body" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-lg border p-4">
          <h2 className="font-semibold">Bo góc & hiệu ứng</h2>
          <div className="space-y-1.5">
            <Label htmlFor="radius-slider">Độ bo góc ({radiusRemToSlider(theme.radius)}rem)</Label>
            <Slider
              id="radius-slider"
              aria-label="Độ bo góc"
              value={[radiusRemToSlider(theme.radius)]}
              min={0}
              max={3}
              step={0.25}
              onValueChange={([v]) => patchTheme({ radius: `${v}rem` })}
            />
          </div>
          <label className="flex items-center justify-between text-sm">
            Cuộn mượt (smooth scroll)
            <Switch checked={theme.effects.smooth_scroll} onCheckedChange={(v) => patchTheme({ effects: { ...theme.effects, smooth_scroll: v } })} />
          </label>
          <label className="flex items-center justify-between text-sm">
            Hiệu ứng parallax
            <Switch checked={theme.effects.parallax} onCheckedChange={(v) => patchTheme({ effects: { ...theme.effects, parallax: v } })} />
          </label>
          <label className="flex items-center justify-between text-sm">
            Confetti khi thêm vào giỏ
            <Switch
              checked={theme.effects.confetti_on_add_to_cart}
              onCheckedChange={(v) => patchTheme({ effects: { ...theme.effects, confetti_on_add_to_cart: v } })}
            />
          </label>
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <h2 className="font-semibold">Hero</h2>
          <div className="space-y-1.5">
            <Label htmlFor="hero-variant">Biến thể</Label>
            <Select value={theme.hero.variant} onValueChange={(v) => patchTheme({ hero: { ...theme.hero, variant: v as ThemeData["hero"]["variant"] } })}>
              <SelectTrigger id="hero-variant" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HERO_VARIANTS.map((v) => (
                  <SelectItem key={v.value} value={v.value}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Tabs defaultValue="vi">
            <TabsList>
              <TabsTrigger value="vi">Tiếng Việt</TabsTrigger>
              <TabsTrigger value="en">Tiếng Anh</TabsTrigger>
            </TabsList>
            <TabsContent value="vi" className="space-y-3 pt-3">
              <div className="space-y-1.5">
                <Label htmlFor="hero-title-vi">Tiêu đề</Label>
                <Input id="hero-title-vi" value={theme.hero.title.vi} onChange={(e) => patchTheme({ hero: { ...theme.hero, title: { ...theme.hero.title, vi: e.target.value } } })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hero-subtitle-vi">Mô tả</Label>
                <Input
                  id="hero-subtitle-vi"
                  value={theme.hero.subtitle?.vi ?? ""}
                  onChange={(e) => patchTheme({ hero: { ...theme.hero, subtitle: { ...theme.hero.subtitle, vi: e.target.value } } })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hero-cta-vi">Nhãn nút CTA</Label>
                <Input
                  id="hero-cta-vi"
                  value={theme.hero.cta?.label.vi ?? ""}
                  onChange={(e) =>
                    patchTheme({
                      hero: { ...theme.hero, cta: { label: { ...theme.hero.cta?.label, vi: e.target.value }, href: theme.hero.cta?.href ?? "/san-pham" } },
                    })
                  }
                />
              </div>
            </TabsContent>
            <TabsContent value="en" className="space-y-3 pt-3">
              <div className="space-y-1.5">
                <Label htmlFor="hero-title-en">Title</Label>
                <Input
                  id="hero-title-en"
                  value={theme.hero.title.en ?? ""}
                  onChange={(e) => patchTheme({ hero: { ...theme.hero, title: { ...theme.hero.title, en: e.target.value } } })}
                />
              </div>
            </TabsContent>
          </Tabs>
          <div className="space-y-1.5">
            <Label>Ảnh nền Hero</Label>
            <ImageUploader
              value={theme.hero.image_url ? [theme.hero.image_url] : []}
              onChange={(urls) => patchTheme({ hero: { ...theme.hero, image_url: urls[0] ?? "" } })}
              folder="theme"
              max={1}
            />
          </div>
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <h2 className="font-semibold">Thứ tự section trang chủ</h2>
          <SectionsPanel sections={theme.sections} onChange={(sections) => patchTheme({ sections })} />
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <h2 className="font-semibold">Thanh thông báo</h2>
          <label className="flex items-center justify-between text-sm">
            Bật thanh thông báo
            <Switch
              checked={theme.announcement_bar.enabled}
              onCheckedChange={(v) => patchTheme({ announcement_bar: { ...theme.announcement_bar, enabled: v } })}
            />
          </label>
          <div className="space-y-1.5">
            <Label htmlFor="announcement-text">Nội dung</Label>
            <Input
              id="announcement-text"
              value={theme.announcement_bar.text.vi}
              onChange={(e) => patchTheme({ announcement_bar: { ...theme.announcement_bar, text: { ...theme.announcement_bar.text, vi: e.target.value } } })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="announcement-href">Đường dẫn khi bấm vào</Label>
            <Input
              id="announcement-href"
              value={theme.announcement_bar.href ?? ""}
              onChange={(e) => patchTheme({ announcement_bar: { ...theme.announcement_bar, href: e.target.value } })}
            />
          </div>
        </div>

        <Separator />

        <div className="flex items-center gap-3 pb-6">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                <RotateCcw className="size-4" />
                Khôi phục mặc định
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Khôi phục giao diện mặc định?</AlertDialogTitle>
                <AlertDialogDescription>Toàn bộ màu sắc, font, thứ tự section sẽ trở về mặc định ban đầu. Hành động này lưu ngay lập tức.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Huỷ</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset}>Khôi phục</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button type="button" disabled={isPending} onClick={handleSaveTheme}>
            <Save className="size-4" />
            Lưu thay đổi
          </Button>
        </div>
      </div>

      <div className="bg-muted/30 sticky top-6 h-[calc(100vh-8rem)] overflow-hidden rounded-lg border">
        <iframe ref={iframeRef} src="/?preview=1" title="Xem trước trang khách" className="h-full w-full" />
      </div>
    </div>
  );
}
