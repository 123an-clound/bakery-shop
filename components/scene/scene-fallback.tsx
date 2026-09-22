import Image from "next/image";

export function SceneFallback({ posterUrl }: { posterUrl?: string }) {
  return (
    <div data-testid="scene-fallback" aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden">
      {posterUrl ? (
        <Image src={posterUrl} alt="" fill sizes="100vw" className="object-cover opacity-25" />
      ) : (
        <div
          className="bg-primary/20 absolute top-1/3 left-1/2 size-[32rem] -translate-x-1/2 rounded-full blur-3xl"
          style={{ animation: "var(--animate-blob)" }}
        />
      )}
    </div>
  );
}
