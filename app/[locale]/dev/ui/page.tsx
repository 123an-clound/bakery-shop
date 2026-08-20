import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { FadeIn } from "@/components/motion/fade-in";
import { Marquee } from "@/components/motion/marquee";
import { Parallax } from "@/components/motion/parallax";
import { Tilt3D } from "@/components/motion/tilt-3d";
import { ConfettiDemoButton } from "./confetti-demo-button";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const SWATCHES = [
  { name: "primary", className: "bg-primary text-primary-foreground" },
  { name: "secondary", className: "bg-secondary text-secondary-foreground" },
  { name: "brand-accent", className: "bg-brand-accent text-brand-accent-foreground" },
  { name: "muted", className: "bg-muted text-muted-foreground" },
  { name: "success", className: "bg-success text-success-foreground" },
  { name: "destructive", className: "bg-destructive text-destructive-foreground" },
];

/** Storybook-lite component gallery — muc Phase 2, chi dung khi phat trien. */
export default function DevUiPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-16 px-4 py-16 sm:px-6 lg:px-8">
      <FadeIn>
        <h1 className="font-heading text-4xl font-bold">/dev/ui — Component gallery</h1>
        <p className="text-muted-foreground mt-2">
          Playful Pastel 3D design system — muc 7 KE-HOACH-DU-AN.md. Trang nay chi dung khi phat
          trien, khong xuat hien trong sitemap (robots noindex).
        </p>
      </FadeIn>

      <section>
        <h2 className="font-heading mb-4 text-2xl font-semibold">Colors (theme runtime)</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {SWATCHES.map((s) => (
            <div key={s.name} className={`shadow-soft rounded-3xl p-4 ${s.className}`}>
              {s.name}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-heading mb-4 text-2xl font-semibold">Typography</h2>
        <div className="space-y-2">
          <p className="font-heading text-5xl font-bold">Heading 1 — Baloo 2</p>
          <p className="font-heading text-3xl font-semibold">Heading 2 — Baloo 2</p>
          <p className="text-base leading-relaxed">
            Body text — Be Vietnam Pro. Bánh kem dâu tây thơm ngon, tươi mới, làm thủ công mỗi
            ngày. Đặt bánh online, giao tận nơi tại TP.HCM.
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-heading mb-4 text-2xl font-semibold">Buttons & inputs</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button className="rounded-full">Primary</Button>
          <Button variant="secondary" className="rounded-full">
            Secondary
          </Button>
          <Button variant="outline" className="rounded-full">
            Outline
          </Button>
          <Button variant="ghost" className="rounded-full">
            Ghost
          </Button>
          <Badge>Mới</Badge>
          <Badge variant="secondary">Hot</Badge>
        </div>
        <Input placeholder="Tìm bánh..." className="mt-4 max-w-xs rounded-full" />
      </section>

      <Separator />

      <section>
        <h2 className="font-heading mb-4 text-2xl font-semibold">Motion</h2>
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground mb-2 text-sm">FadeIn (scroll xuống de xem)</p>
            <FadeIn className="bg-secondary/50 shadow-soft rounded-3xl p-6">Fade + slide-up 24px</FadeIn>
          </div>
          <div>
            <p className="text-muted-foreground mb-2 text-sm">Tilt3D (di chuot vao)</p>
            <Tilt3D className="bg-primary/30 shadow-lift flex h-32 items-center justify-center rounded-3xl">
              🎂 Hover me
            </Tilt3D>
          </div>
          <div>
            <p className="text-muted-foreground mb-2 text-sm">Parallax</p>
            <Parallax speed={0.4} className="bg-muted rounded-3xl p-6">
              Di chuyen theo scroll
            </Parallax>
          </div>
          <div>
            <p className="text-muted-foreground mb-2 text-sm">Confetti</p>
            <ConfettiDemoButton />
          </div>
        </div>
        <div className="bg-secondary/50 mt-8 rounded-3xl py-3">
          <Marquee className="text-sm font-medium">
            <span className="px-4">🍰 Marquee ticker</span>
            <span className="px-4">•</span>
          </Marquee>
        </div>
      </section>
    </div>
  );
}
