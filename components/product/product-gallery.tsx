"use client";

import { useState } from "react";
import Image from "next/image";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const current = images[active];

  if (!current) return <div className="bg-muted aspect-square rounded-4xl" />;

  return (
    <div>
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="focus-visible:ring-primary shadow-soft relative block aspect-square w-full overflow-hidden rounded-4xl focus-visible:ring-4 focus-visible:outline-none"
      >
        <Image
          src={current}
          alt={alt}
          fill
          priority
          sizes="(min-width: 1024px) 45vw, 100vw"
          className="object-cover transition-transform duration-300 hover:scale-105"
        />
      </button>

      {images.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-2xl border-2 transition-colors",
                i === active ? "border-primary" : "border-transparent",
              )}
            >
              <Image src={img} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          <div className="relative aspect-square w-full">
            <Image src={current} alt={alt} fill sizes="90vw" className="rounded-3xl object-contain" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
