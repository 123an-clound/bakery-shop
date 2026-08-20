"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { Loader2, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { submitCustomCakeRequest, type CustomCakeState } from "@/lib/actions/custom-cake";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const TOTAL_STEPS = 5;
const MAX_IMAGES = 3;

function minNeedAt(): string {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  d.setSeconds(0, 0);
  return d.toISOString().slice(0, 16);
}

const initialState: CustomCakeState = { status: "idle" };

export function CustomCakeWizard() {
  const t = useTranslations("CustomCake");
  const [step, setStep] = useState(1);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [state, formAction, isPending] = useActionState(submitCustomCakeRequest, initialState);

  const [form, setForm] = useState({
    size: "",
    layers: "1",
    sponge: "",
    cream: "",
    flavor: "",
    colorTheme: "",
    messageOnCake: "",
    needAt: minNeedAt(),
    budget: "",
    customerName: "",
    phone: "",
    email: "",
    note: "",
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || images.length >= MAX_IMAGES) return;

    setUploading(true);
    setUploadError(null);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      if (!res.ok) {
        setUploadError(t("uploadError"));
        return;
      }
      const data = (await res.json()) as { url: string };
      setImages((prev) => [...prev, data.url]);
    } catch {
      setUploadError(t("uploadError"));
    } finally {
      setUploading(false);
    }
  }

  const stepValid = (() => {
    switch (step) {
      case 1:
        return form.size.trim() !== "" && Number(form.layers) >= 1;
      case 2:
        return form.sponge.trim() !== "" && form.cream.trim() !== "" && form.flavor.trim() !== "";
      case 3:
        return true;
      case 4:
        return form.needAt !== "";
      case 5:
        return form.customerName.trim() !== "" && /^0\d{9}$/.test(form.phone);
      default:
        return false;
    }
  })();

  if (state.status === "success") {
    return (
      <div className="bg-success/15 text-success-foreground rounded-3xl p-8 text-center">
        <p className="text-lg font-semibold">{t("successTitle")}</p>
        <p className="mt-1 text-sm">{t("successSubtitle")}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center gap-2">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            className={cn("h-1.5 flex-1 rounded-full", i < step ? "bg-primary" : "bg-muted")}
          />
        ))}
      </div>

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="size" value={form.size} />
        <input type="hidden" name="layers" value={form.layers} />
        <input type="hidden" name="sponge" value={form.sponge} />
        <input type="hidden" name="cream" value={form.cream} />
        <input type="hidden" name="flavor" value={form.flavor} />
        <input type="hidden" name="colorTheme" value={form.colorTheme} />
        <input type="hidden" name="messageOnCake" value={form.messageOnCake} />
        <input type="hidden" name="needAt" value={form.needAt} />
        <input type="hidden" name="budget" value={form.budget} />
        <input type="hidden" name="customerName" value={form.customerName} />
        <input type="hidden" name="phone" value={form.phone} />
        <input type="hidden" name="email" value={form.email} />
        <input type="hidden" name="note" value={form.note} />
        {images.map((url) => (
          <input key={url} type="hidden" name="referenceImages" value={url} />
        ))}

        {step === 1 ? (
          <div className="space-y-4">
            <h2 className="font-heading text-xl font-semibold">{t("step1Title")}</h2>
            <div>
              <label className="mb-1 block text-sm font-medium">{t("size")}</label>
              <Input
                value={form.size}
                onChange={(e) => update("size", e.target.value)}
                placeholder={t("sizePlaceholder")}
                className="rounded-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t("layers")}</label>
              <Input
                type="number"
                min={1}
                max={10}
                value={form.layers}
                onChange={(e) => update("layers", e.target.value)}
                className="rounded-full"
              />
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <h2 className="font-heading text-xl font-semibold">{t("step2Title")}</h2>
            <div>
              <label className="mb-1 block text-sm font-medium">{t("sponge")}</label>
              <Input
                value={form.sponge}
                onChange={(e) => update("sponge", e.target.value)}
                placeholder={t("spongePlaceholder")}
                className="rounded-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t("cream")}</label>
              <Input
                value={form.cream}
                onChange={(e) => update("cream", e.target.value)}
                placeholder={t("creamPlaceholder")}
                className="rounded-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t("flavor")}</label>
              <Input
                value={form.flavor}
                onChange={(e) => update("flavor", e.target.value)}
                placeholder={t("flavorPlaceholder")}
                className="rounded-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t("colorTheme")}</label>
              <Input
                value={form.colorTheme}
                onChange={(e) => update("colorTheme", e.target.value)}
                placeholder={t("colorThemePlaceholder")}
                className="rounded-full"
              />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <h2 className="font-heading text-xl font-semibold">{t("step3Title")}</h2>
            <div>
              <label className="mb-1 block text-sm font-medium">{t("messageOnCake")}</label>
              <Input
                value={form.messageOnCake}
                onChange={(e) => update("messageOnCake", e.target.value)}
                maxLength={120}
                placeholder={t("messageOnCakePlaceholder")}
                className="rounded-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t("referenceImages")}</label>
              <div className="flex flex-wrap gap-3">
                {images.map((url) => (
                  <div key={url} className="relative size-24 overflow-hidden rounded-2xl">
                    <Image src={url} alt="" fill sizes="96px" className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((u) => u !== url))}
                      className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
                {images.length < MAX_IMAGES ? (
                  <label className="border-input flex size-24 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed">
                    {uploading ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <Upload className="text-muted-foreground size-5" />
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      className="hidden"
                      onChange={handleFileSelect}
                      disabled={uploading}
                    />
                  </label>
                ) : null}
              </div>
              {uploadError ? <p className="text-destructive mt-1 text-xs">{uploadError}</p> : null}
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
            <h2 className="font-heading text-xl font-semibold">{t("step4Title")}</h2>
            <div>
              <label className="mb-1 block text-sm font-medium">{t("needAt")}</label>
              <Input
                type="datetime-local"
                min={minNeedAt()}
                value={form.needAt}
                onChange={(e) => update("needAt", e.target.value)}
                className="rounded-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t("budget")}</label>
              <Input
                type="number"
                min={0}
                value={form.budget}
                onChange={(e) => update("budget", e.target.value)}
                placeholder={t("budgetPlaceholder")}
                className="rounded-full"
              />
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="space-y-4">
            <h2 className="font-heading text-xl font-semibold">{t("step5Title")}</h2>
            <div>
              <label className="mb-1 block text-sm font-medium">{t("customerName")}</label>
              <Input
                value={form.customerName}
                onChange={(e) => update("customerName", e.target.value)}
                className="rounded-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t("phone")}</label>
              <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} className="rounded-full" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t("email")}</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="rounded-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t("note")}</label>
              <textarea
                value={form.note}
                onChange={(e) => update("note", e.target.value)}
                rows={3}
                className="border-input w-full rounded-2xl border p-3 text-sm"
              />
            </div>
          </div>
        ) : null}

        {state.status === "error" ? <p className="text-destructive text-sm">{t("submitError")}</p> : null}

        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
          >
            {t("back")}
          </Button>
          {step < TOTAL_STEPS ? (
            <Button
              type="button"
              className="rounded-full px-8"
              disabled={!stepValid}
              onClick={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
            >
              {t("next")}
            </Button>
          ) : (
            <Button type="submit" className="rounded-full px-8" disabled={!stepValid || isPending}>
              {isPending ? "..." : t("submit")}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
