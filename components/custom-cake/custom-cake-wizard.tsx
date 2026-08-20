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

// A <input type="datetime-local"> value/min is interpreted in the BROWSER's
// local time, with no timezone marker — toISOString() returns UTC, which on
// any machine not at UTC+0 silently shifts the represented instant by the
// local offset (e.g. -7h in Vietnam, so a "+26h" UTC string reads back as
// only ~19h away once the browser parses it as local time). Build the
// string from local getters instead so it means what it says.
function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// The server re-checks "needAt is at least 24h from now" at the moment the
// form is actually submitted, not at mount time — defaulting to exactly
// +24h means any real user who takes more than an instant to fill the
// 5-step form would have this valid-looking default silently rejected.
// +26h gives two hours of headroom for that gap.
function defaultNeedAt(): string {
  return toDatetimeLocalValue(new Date(Date.now() + 26 * 60 * 60 * 1000));
}

function minNeedAt(): string {
  return toDatetimeLocalValue(new Date(Date.now() + 24 * 60 * 60 * 1000));
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
    needAt: defaultNeedAt(),
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
              <label htmlFor="cake-size" className="mb-1 block text-sm font-medium">
                {t("size")}
              </label>
              <Input
                id="cake-size"
                value={form.size}
                onChange={(e) => update("size", e.target.value)}
                placeholder={t("sizePlaceholder")}
                className="rounded-full"
              />
            </div>
            <div>
              <label htmlFor="cake-layers" className="mb-1 block text-sm font-medium">
                {t("layers")}
              </label>
              <Input
                id="cake-layers"
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
              <label htmlFor="cake-sponge" className="mb-1 block text-sm font-medium">
                {t("sponge")}
              </label>
              <Input
                id="cake-sponge"
                value={form.sponge}
                onChange={(e) => update("sponge", e.target.value)}
                placeholder={t("spongePlaceholder")}
                className="rounded-full"
              />
            </div>
            <div>
              <label htmlFor="cake-cream" className="mb-1 block text-sm font-medium">
                {t("cream")}
              </label>
              <Input
                id="cake-cream"
                value={form.cream}
                onChange={(e) => update("cream", e.target.value)}
                placeholder={t("creamPlaceholder")}
                className="rounded-full"
              />
            </div>
            <div>
              <label htmlFor="cake-flavor" className="mb-1 block text-sm font-medium">
                {t("flavor")}
              </label>
              <Input
                id="cake-flavor"
                value={form.flavor}
                onChange={(e) => update("flavor", e.target.value)}
                placeholder={t("flavorPlaceholder")}
                className="rounded-full"
              />
            </div>
            <div>
              <label htmlFor="cake-color-theme" className="mb-1 block text-sm font-medium">
                {t("colorTheme")}
              </label>
              <Input
                id="cake-color-theme"
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
              <label htmlFor="cake-message" className="mb-1 block text-sm font-medium">
                {t("messageOnCake")}
              </label>
              <Input
                id="cake-message"
                value={form.messageOnCake}
                onChange={(e) => update("messageOnCake", e.target.value)}
                maxLength={120}
                placeholder={t("messageOnCakePlaceholder")}
                className="rounded-full"
              />
            </div>
            <div>
              <span id="cake-ref-images-label" className="mb-1 block text-sm font-medium">
                {t("referenceImages")}
              </span>
              <div role="group" aria-labelledby="cake-ref-images-label" className="flex flex-wrap gap-3">
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
                      aria-label={t("referenceImages")}
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
              <label htmlFor="cake-need-at" className="mb-1 block text-sm font-medium">
                {t("needAt")}
              </label>
              <Input
                id="cake-need-at"
                type="datetime-local"
                min={minNeedAt()}
                value={form.needAt}
                onChange={(e) => update("needAt", e.target.value)}
                className="rounded-full"
              />
            </div>
            <div>
              <label htmlFor="cake-budget" className="mb-1 block text-sm font-medium">
                {t("budget")}
              </label>
              <Input
                id="cake-budget"
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
              <label htmlFor="cake-customer-name" className="mb-1 block text-sm font-medium">
                {t("customerName")}
              </label>
              <Input
                id="cake-customer-name"
                value={form.customerName}
                onChange={(e) => update("customerName", e.target.value)}
                className="rounded-full"
              />
            </div>
            <div>
              <label htmlFor="cake-phone" className="mb-1 block text-sm font-medium">
                {t("phone")}
              </label>
              <Input
                id="cake-phone"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className="rounded-full"
              />
            </div>
            <div>
              <label htmlFor="cake-email" className="mb-1 block text-sm font-medium">
                {t("email")}
              </label>
              <Input
                id="cake-email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="rounded-full"
              />
            </div>
            <div>
              <label htmlFor="cake-note" className="mb-1 block text-sm font-medium">
                {t("note")}
              </label>
              <textarea
                id="cake-note"
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
