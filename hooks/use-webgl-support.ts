"use client";

import { useSyncExternalStore } from "react";

function subscribe(): () => void {
  return () => {};
}

function getSnapshot(): boolean {
  // Keep the canvas mounted when the browser reports a software/headless
  // context as unavailable. R3F's error boundary owns the real fallback; this
  // avoids an entire scene disappearing before it can report a useful error.
  // The server snapshot is also optimistic, preventing hydration layout shifts.
  return true;
}

function getServerSnapshot(): boolean {
  return true;
}

export function useWebglSupport(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
