"use client";

import { useActionState } from "react";
import { Check, ChefHat, Clock, PartyPopper, Truck, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { trackOrder, type TrackOrderState } from "@/lib/actions/track-order";
import type { Locale } from "@/lib/bakery/types";
import { formatDateTime, formatMoney } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const STEPS = [
  { status: "pending", icon: Clock, labelKey: "statusPending" },
  { status: "confirmed", icon: Check, labelKey: "statusConfirmed" },
  { status: "baking", icon: ChefHat, labelKey: "statusBaking" },
  { status: "delivering", icon: Truck, labelKey: "statusDelivering" },
  { status: "completed", icon: PartyPopper, labelKey: "statusCompleted" },
] as const;

const initialState: TrackOrderState = { status: "idle" };

export function TrackOrderForm({ locale }: { locale: Locale }) {
  const t = useTranslations("TrackOrder");
  const [state, formAction, isPending] = useActionState(trackOrder, initialState);

  const currentStepIndex = state.order ? STEPS.findIndex((s) => s.status === state.order!.status) : -1;
  const isCancelled = state.order?.status === "cancelled";

  return (
    <div>
      <form action={formAction} className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="track-order-code" className="sr-only">
            {t("orderCode")}
          </label>
          <Input id="track-order-code" name="code" placeholder={t("orderCode")} required className="rounded-full" />
        </div>
        <div>
          <label htmlFor="track-order-last4" className="sr-only">
            {t("last4Phone")}
          </label>
          <Input
            id="track-order-last4"
            name="last4Phone"
            placeholder={t("last4Phone")}
            required
            maxLength={4}
            pattern="\d{4}"
            inputMode="numeric"
            className="rounded-full sm:max-w-40"
          />
        </div>
        <Button type="submit" disabled={isPending} className="shrink-0 rounded-full px-8">
          {isPending ? "..." : t("submit")}
        </Button>
      </form>

      {state.status === "error" ? <p className="text-destructive mt-4 text-sm">{t("notFound")}</p> : null}

      {state.status === "success" && state.order ? (
        <div className="bg-secondary/30 mt-8 rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <span className="font-heading text-xl font-bold">{state.order.code}</span>
            <span className="text-brand-accent font-semibold">{formatMoney(state.order.total, locale)}</span>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("deliveryAt")}: {formatDateTime(state.order.deliveryAt, locale)}
          </p>

          {isCancelled ? (
            <div className="text-destructive mt-6 flex items-center gap-2">
              <X className="size-5" />
              <span className="font-medium">{t("statusCancelled")}</span>
            </div>
          ) : (
            <div className="mt-6 flex items-center justify-between">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                const reached = i <= currentStepIndex;
                return (
                  <div key={step.status} className="flex flex-1 flex-col items-center text-center">
                    <div
                      className={cn(
                        "flex size-9 items-center justify-center rounded-full",
                        reached ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                    <span className="mt-1 text-[11px] leading-tight">{t(step.labelKey)}</span>
                    {i < STEPS.length - 1 ? (
                      <div className={cn("mt-4 h-0.5 w-full", reached ? "bg-primary" : "bg-muted")} />
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
