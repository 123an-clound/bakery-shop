"use client";

import { useEffect } from "react";

import { useCartStore } from "@/lib/store/cart";

/** Manually triggers the cart's persisted-state rehydration after mount — see lib/store/cart.ts. */
export function CartHydration() {
  useEffect(() => {
    useCartStore.persist.rehydrate();
  }, []);

  return null;
}
