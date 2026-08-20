import { useSyncExternalStore } from "react"

const MOBILE_BREAKPOINT = 768

function subscribe(callback: () => void) {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  mql.addEventListener("change", callback)
  return () => mql.removeEventListener("change", callback)
}

function getSnapshot() {
  return window.innerWidth < MOBILE_BREAKPOINT
}

// `getServerSnapshot` returns `false` so the server render and the first
// client render (pre-hydration) agree — avoids a hydration mismatch, unlike
// branching on `typeof window` inside a useEffect + setState pair.
export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
