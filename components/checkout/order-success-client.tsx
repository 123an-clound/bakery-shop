"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";

import { fireConfetti } from "@/components/motion/confetti";
import { Button } from "@/components/ui/button";

export function OrderSuccessConfetti({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    fireConfetti({ enabled, particleCount: 100 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once on mount only
  }, []);
  return null;
}

export function CopyableRow({ label, value }: { label: string; value: string }) {
  const t = useTranslations("OrderSuccess");
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <div>
        <span className="text-muted-foreground">{label}: </span>
        <span className="font-medium">{value}</span>
      </div>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="text-muted-foreground hover:text-primary shrink-0"
        aria-label={t("copy")}
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      </button>
    </div>
  );
}

export function CopyOrderCodeButton({ code }: { code: string }) {
  const t = useTranslations("OrderSuccess");
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="rounded-full"
      onClick={async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check className="mr-1 size-3.5" /> : <Copy className="mr-1 size-3.5" />}
      {t("copy")}
    </Button>
  );
}
