"use client";
import { useSyncExternalStore } from "react";
import { useCartStore } from "@/lib/store/cart";

const subscribe = (notify: () => void) => useCartStore.persist.onFinishHydration(notify);
export function useCartHydrated() {
  return useSyncExternalStore(subscribe, () => useCartStore.persist.hasHydrated(), () => false);
}
