"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(max-width: 767px)";

function subscribe(callback: () => void) {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function getSnapshot(): boolean {
  // hardwareConcurrency is static, so it needs no subscription — only the
  // viewport width can change (resize/rotation). Older browsers report
  // undefined; treat that as "not weak", matching the optimistic server value.
  const cores = navigator.hardwareConcurrency;
  return window.matchMedia(QUERY).matches && typeof cores === "number" && cores <= 4;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useWeakMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
