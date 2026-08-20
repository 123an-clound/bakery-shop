import { cn } from "@/lib/utils";

/**
 * Infinite horizontal ticker — muc 8.11 ("Bánh tươi mỗi ngày • Giao nhanh 2h...").
 * Pure CSS animation (no JS), content duplicated for a seamless loop.
 */
export function Marquee({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex overflow-hidden", className)}>
      <div className="animate-marquee flex shrink-0 items-center gap-8 pr-8 motion-reduce:animate-none">
        {children}
      </div>
      <div
        aria-hidden
        className="animate-marquee flex shrink-0 items-center gap-8 pr-8 motion-reduce:animate-none"
      >
        {children}
      </div>
    </div>
  );
}
