# 3D Premium Bakery Homepage + Persistent Scene Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a scroll-driven 3D cake hero scene that persists across route navigation, and restyle the homepage to a "premium bakery" look — without touching cart/checkout/auth/admin business logic or breaking the existing Theme Editor.

**Architecture:** A single `<Canvas>` (React Three Fiber) mounts once in the shared `[locale]` layout as a fixed, `-z-10`, `pointer-events-none` background layer, so client-side navigation never remounts the WebGL context. A zustand store holds the current camera/object/light transform; a pure function maps homepage scroll progress (via `motion`'s `useScroll`) to that transform. Non-homepage routes leave the scene in a static "ambient" resting transform. WebGL-unsupported / `prefers-reduced-motion` / runtime-error paths all fall back to a static poster layer — never a blank canvas.

**Tech Stack:** `@react-three/fiber` + `@react-three/drei` + `three` (new), `motion` (existing, drives scroll — no GSAP added), `zustand` (existing, new unpersisted store), Next.js 16 App Router, TypeScript strict + `noUncheckedIndexedAccess`.

**Spec:** `docs/superpowers/specs/2026-09-22-3d-bakery-homepage-hero-design.md`

## Global Constraints

- No new Supabase table; no change to any API route, Server Action, or RLS policy (cart/checkout/auth/admin logic stays untouched).
- The admin Theme Editor (`/admin/giao-dien`) must keep working exactly as before — `ThemeData` schema is unchanged, only the *default values* in `lib/theme/default-theme.ts`/`lib/theme/presets.ts` change.
- TypeScript strict + `noUncheckedIndexedAccess`. Server Component is the default; add `"use client"` only where state/effects/R3F hooks are required.
- All customer-facing text comes from `messages/*.json` via `next-intl` — this plan adds no new user-facing copy, so no message-file changes are needed.
- `prefers-reduced-motion` must fully disable the 3D scene (static fallback), matching `theme.effects.reduced_motion_respect`.
- Do **not** add GSAP or GSAP ScrollTrigger — scroll-driven animation uses the already-installed `motion` package's `useScroll`/`useMotionValueEvent`.
- Do **not** fetch or bundle an external `.glb`/`.gltf` model — the cake is built procedurally from Three.js/drei primitives.
- `SceneCanvas` must be `next/dynamic(..., { ssr: false })` so the ~150-200KB R3F/three bundle never blocks SSR or the homepage LCP path.
- Out of scope for this plan (do not implement): product-card 3D tilt/quick-view, checkout micro-interactions, per-route storytelling beyond the homepage, particle systems beyond the cake's own decorations.

---

### Task 1: Install 3D dependencies

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml` (via pnpm, not hand-edited)

**Interfaces:**
- Produces: `@react-three/fiber`, `@react-three/drei`, `three` importable by every later task; `@types/three` for editor/tsc type support.

- [ ] **Step 1: Install the runtime and type packages**

Run:
```bash
pnpm add @react-three/fiber @react-three/drei three
pnpm add -D @types/three
```

- [ ] **Step 2: Verify install didn't break anything**

Run: `pnpm typecheck`
Expected: PASS (no new code yet, this only proves the lockfile/install is sane)

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(deps): add react-three-fiber, drei, three for 3D hero scene"
```

---

### Task 2: Scroll-progress → scene-transform mapping (pure function)

**Files:**
- Create: `lib/scene/transform.ts`
- Test: `tests/unit/scene-transform.test.ts`

**Interfaces:**
- Produces: `SceneStage` (`"hero" | "ambient"`), `SceneTransform` interface (`cameraTarget`/`objectRotation`/`objectPosition`: `[number, number, number]`, `lightIntensity: number`), `computeSceneTransform(progress: number, stage: SceneStage): SceneTransform`. Consumed by Task 3 (store) and Task 6 (cake model reads store) and Task 8 (controller).

- [ ] **Step 1: Write the failing tests**

```ts
// tests/unit/scene-transform.test.ts
import { describe, expect, it } from "vitest";

import { computeSceneTransform } from "@/lib/scene/transform";

describe("computeSceneTransform — ambient stage", () => {
  it("returns the same fixed resting transform regardless of progress", () => {
    const a = computeSceneTransform(0, "ambient");
    const b = computeSceneTransform(0.7, "ambient");
    expect(a).toEqual(b);
    expect(a.objectPosition).toEqual([0, -0.2, 0]);
  });
});

describe("computeSceneTransform — hero stage", () => {
  it("matches the first keyframe at progress 0", () => {
    const t = computeSceneTransform(0, "hero");
    expect(t.cameraTarget).toEqual([0, 1.2, 5]);
    expect(t.objectRotation).toEqual([0, 0, 0]);
    expect(t.lightIntensity).toBe(1);
  });

  it("matches the last keyframe at progress 1", () => {
    const t = computeSceneTransform(1, "hero");
    expect(t.cameraTarget).toEqual([-1.2, 2, 4]);
    expect(t.objectRotation[1]).toBeCloseTo(Math.PI * 2);
    expect(t.lightIntensity).toBe(0.8);
  });

  it("interpolates halfway between the 0 and 0.5 keyframes at progress 0.25", () => {
    const t = computeSceneTransform(0.25, "hero");
    expect(t.cameraTarget[0]).toBeCloseTo(0.75); // lerp(0, 1.5, 0.5)
    expect(t.lightIntensity).toBeCloseTo(1.2); // lerp(1, 1.4, 0.5)
  });

  it("clamps out-of-range progress to the boundary keyframes", () => {
    expect(computeSceneTransform(-0.5, "hero")).toEqual(computeSceneTransform(0, "hero"));
    expect(computeSceneTransform(1.5, "hero")).toEqual(computeSceneTransform(1, "hero"));
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test tests/unit/scene-transform.test.ts`
Expected: FAIL with "Cannot find module '@/lib/scene/transform'"

- [ ] **Step 3: Implement**

```ts
// lib/scene/transform.ts
export type SceneStage = "hero" | "ambient";

export interface SceneTransform {
  cameraTarget: [number, number, number];
  objectRotation: [number, number, number];
  objectPosition: [number, number, number];
  lightIntensity: number;
}

/** Static resting pose shown on every non-homepage route. */
const AMBIENT_TRANSFORM: SceneTransform = {
  cameraTarget: [0, 1, 6],
  objectRotation: [0, 0.4, 0],
  objectPosition: [0, -0.2, 0],
  lightIntensity: 0.7,
};

/**
 * Homepage scroll storytelling beats. `at` is scrollYProgress (0-1).
 * computeSceneTransform interpolates linearly between the two keyframes
 * bracketing the current progress.
 */
const HERO_KEYFRAMES: { at: number; transform: SceneTransform }[] = [
  {
    at: 0,
    transform: { cameraTarget: [0, 1.2, 5], objectRotation: [0, 0, 0], objectPosition: [0, 0, 0], lightIntensity: 1 },
  },
  {
    at: 0.5,
    transform: {
      cameraTarget: [1.5, 1.6, 3.5],
      objectRotation: [0, Math.PI, 0],
      objectPosition: [0, 0.3, 0],
      lightIntensity: 1.4,
    },
  },
  {
    at: 1,
    transform: {
      cameraTarget: [-1.2, 2, 4],
      objectRotation: [0, Math.PI * 2, 0],
      objectPosition: [0, 0, 0],
      lightIntensity: 0.8,
    },
  },
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpTransform(a: SceneTransform, b: SceneTransform, t: number): SceneTransform {
  return {
    cameraTarget: [
      lerp(a.cameraTarget[0], b.cameraTarget[0], t),
      lerp(a.cameraTarget[1], b.cameraTarget[1], t),
      lerp(a.cameraTarget[2], b.cameraTarget[2], t),
    ],
    objectRotation: [
      lerp(a.objectRotation[0], b.objectRotation[0], t),
      lerp(a.objectRotation[1], b.objectRotation[1], t),
      lerp(a.objectRotation[2], b.objectRotation[2], t),
    ],
    objectPosition: [
      lerp(a.objectPosition[0], b.objectPosition[0], t),
      lerp(a.objectPosition[1], b.objectPosition[1], t),
      lerp(a.objectPosition[2], b.objectPosition[2], t),
    ],
    lightIntensity: lerp(a.lightIntensity, b.lightIntensity, t),
  };
}

export function computeSceneTransform(progress: number, stage: SceneStage): SceneTransform {
  if (stage === "ambient") return AMBIENT_TRANSFORM;

  const clamped = Math.min(1, Math.max(0, progress));
  const nextIndex = HERO_KEYFRAMES.findIndex((k) => k.at >= clamped);
  if (nextIndex <= 0) return HERO_KEYFRAMES[0]!.transform;

  const prev = HERO_KEYFRAMES[nextIndex - 1]!;
  const next = HERO_KEYFRAMES[nextIndex]!;
  const t = (clamped - prev.at) / (next.at - prev.at);
  return lerpTransform(prev.transform, next.transform, t);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test tests/unit/scene-transform.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/scene/transform.ts tests/unit/scene-transform.test.ts
git commit -m "feat(scene): add pure scroll-progress to 3D transform mapping"
```

---

### Task 3: Scene state store

**Files:**
- Create: `lib/store/scene.ts`
- Test: `tests/unit/scene-store.test.ts`

**Interfaces:**
- Consumes: `computeSceneTransform`, `SceneStage`, `SceneTransform` from `lib/scene/transform.ts` (Task 2).
- Produces: `useSceneStore` zustand hook with state `{ stage, cameraTarget, objectRotation, objectPosition, lightIntensity, sceneReady }` and actions `setStage(stage)`, `setTransform(transform: SceneTransform)`, `setReady(ready: boolean)`. Consumed by Task 6 (cake model, via `.getState()`), Task 8 (controller, via selectors).

- [ ] **Step 1: Write the failing tests**

```ts
// tests/unit/scene-store.test.ts
import { describe, expect, it } from "vitest";

import { useSceneStore } from "@/lib/store/scene";
import { computeSceneTransform } from "@/lib/scene/transform";

describe("useSceneStore", () => {
  it("starts in the ambient stage with the ambient transform and sceneReady false", () => {
    const state = useSceneStore.getState();
    expect(state.stage).toBe("ambient");
    expect(state).toMatchObject(computeSceneTransform(0, "ambient"));
    expect(state.sceneReady).toBe(false);
  });

  it("setStage updates the stage", () => {
    useSceneStore.getState().setStage("hero");
    expect(useSceneStore.getState().stage).toBe("hero");
    useSceneStore.getState().setStage("ambient");
  });

  it("setTransform merges the transform fields", () => {
    useSceneStore.getState().setTransform(computeSceneTransform(1, "hero"));
    expect(useSceneStore.getState().cameraTarget).toEqual([-1.2, 2, 4]);
  });

  it("setReady updates sceneReady", () => {
    useSceneStore.getState().setReady(true);
    expect(useSceneStore.getState().sceneReady).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test tests/unit/scene-store.test.ts`
Expected: FAIL with "Cannot find module '@/lib/store/scene'"

- [ ] **Step 3: Implement**

```ts
// lib/store/scene.ts
import { create } from "zustand";

import { computeSceneTransform, type SceneStage, type SceneTransform } from "@/lib/scene/transform";

interface SceneState extends SceneTransform {
  stage: SceneStage;
  sceneReady: boolean;
  setStage: (stage: SceneStage) => void;
  setTransform: (transform: SceneTransform) => void;
  setReady: (ready: boolean) => void;
}

/**
 * Derived UI state (scroll position, route), not user data — deliberately
 * NOT persisted (unlike lib/store/cart.ts), resets fine every session.
 */
export const useSceneStore = create<SceneState>((set) => ({
  stage: "ambient",
  ...computeSceneTransform(0, "ambient"),
  sceneReady: false,
  setStage: (stage) => set({ stage }),
  setTransform: (transform) => set(transform),
  setReady: (sceneReady) => set({ sceneReady }),
}));
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test tests/unit/scene-store.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/store/scene.ts tests/unit/scene-store.test.ts
git commit -m "feat(scene): add unpersisted zustand store for scene transform"
```

---

### Task 4: Capability-detection hooks (reduced-motion, WebGL support)

**Files:**
- Create: `hooks/use-reduced-motion.ts`
- Create: `hooks/use-webgl-support.ts`

**Interfaces:**
- Produces: `useReducedMotion(): boolean`, `useWebglSupport(): boolean`. Consumed by Task 9 (`scene-root.tsx`).

No automated test: both hooks read `window`/`document`, and this project's Vitest runs with `environment: "node"` (see `vitest.config.mts:5`) with no jsdom — `jsdom` was deliberately removed from the project recently (commits `76ee5e4`, `ac5d550`, `b155e7c`) to fix an ESM crash, so it must not be reintroduced. Verified instead by the Playwright e2e spec in Task 12 (`reducedMotion` path) and by manual browser-verify in Task 13.

- [ ] **Step 1: Implement `use-reduced-motion.ts`**

Same `useSyncExternalStore` pattern already used in `components/layout/lenis-provider.tsx:8-22` — extracted here as a shared hook since the 3D layer adds new call sites that need it (the existing inline copies in `lenis-provider.tsx`/`announcement-bar.tsx`/`count-up.tsx` are left untouched — not part of this plan's scope).

```ts
// hooks/use-reduced-motion.ts
"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function getSnapshot(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
```

- [ ] **Step 2: Implement `use-webgl-support.ts`**

WebGL support never changes after page load, so `subscribe` is a no-op — but the `useSyncExternalStore` shape still matters: it's what makes the first client render match the server render (both assume supported) and only flip after mount, avoiding the exact hydration-mismatch class of bug already fixed once in this codebase (Phase 2, see `CLAUDE.md` — "đọc localStorage/matchMedia qua nhánh `typeof window` trong lazy `useState`... sửa bằng `useSyncExternalStore`").

```ts
// hooks/use-webgl-support.ts
"use client";

import { useSyncExternalStore } from "react";

function subscribe(): () => void {
  return () => {};
}

function getSnapshot(): boolean {
  const canvas = document.createElement("canvas");
  return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
}

function getServerSnapshot(): boolean {
  return true;
}

export function useWebglSupport(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add hooks/use-reduced-motion.ts hooks/use-webgl-support.ts
git commit -m "feat(scene): add reduced-motion and WebGL support detection hooks"
```

---

### Task 5: Fallback UI + error boundary

**Files:**
- Create: `components/scene/scene-fallback.tsx`
- Create: `components/scene/scene-error-boundary.tsx`

**Interfaces:**
- Produces: `SceneFallback({ posterUrl?: string })`, `SceneErrorBoundary({ fallback: ReactNode, children: ReactNode })`. Consumed by Task 9 (`scene-root.tsx`).

No automated test: both are DOM-rendered UI with no meaningful logic to assert without a browser (jsdom is intentionally absent from this project, see Task 4). Verified by manual browser-verify in Task 13 and by the Playwright spec in Task 12 (fallback visibility under `reducedMotion`).

- [ ] **Step 1: Implement `scene-fallback.tsx`**

Reuses `hero.image_url` (the Theme Editor's existing hero-image field, no longer displayed inline by `HeroSection` after Task 11) as the poster image, so that admin-uploaded field keeps a real purpose instead of going unused.

```tsx
// components/scene/scene-fallback.tsx
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
```

- [ ] **Step 2: Implement `scene-error-boundary.tsx`**

```tsx
// components/scene/scene-error-boundary.tsx
"use client";

import { Component, type ReactNode } from "react";

interface Props {
  fallback: ReactNode;
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class SceneErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Scene 3D render error, falling back to static poster:", error);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add components/scene/scene-fallback.tsx components/scene/scene-error-boundary.tsx
git commit -m "feat(scene): add static fallback and error boundary for the 3D layer"
```

---

### Task 6: Procedural cake model

**Files:**
- Create: `components/scene/cake-model.tsx`

**Interfaces:**
- Consumes: `useSceneStore` (Task 3).
- Produces: `CakeModel()` — a self-contained R3F component with no props (reads the store directly via `.getState()` inside `useFrame`, not a React subscription, so store updates don't trigger React re-renders 60x/sec — R3F's own render loop handles it). Consumed by Task 7 (`scene-canvas.tsx`).

No automated test: R3F renders to a `<canvas>` via WebGL, which has no meaningful jsdom-free unit-test story. Verified by manual browser-verify in Task 13.

- [ ] **Step 1: Implement**

```tsx
// components/scene/cake-model.tsx
"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { useSceneStore } from "@/lib/store/scene";

const STRAWBERRY_COUNT = 5;

export function CakeModel() {
  const group = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!group.current) return;
    const { objectRotation, objectPosition } = useSceneStore.getState();
    group.current.rotation.set(
      THREE.MathUtils.lerp(group.current.rotation.x, objectRotation[0], 0.06),
      THREE.MathUtils.lerp(group.current.rotation.y, objectRotation[1], 0.06),
      THREE.MathUtils.lerp(group.current.rotation.z, objectRotation[2], 0.06),
    );
    group.current.position.set(
      THREE.MathUtils.lerp(group.current.position.x, objectPosition[0], 0.06),
      THREE.MathUtils.lerp(group.current.position.y, objectPosition[1], 0.06),
      THREE.MathUtils.lerp(group.current.position.z, objectPosition[2], 0.06),
    );
  });

  return (
    <group ref={group}>
      {/* Base tier */}
      <mesh position={[0, -0.6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.4, 1.4, 0.7, 48]} />
        <meshStandardMaterial color="#F3E4D0" roughness={0.6} />
      </mesh>
      {/* Top tier */}
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.0, 1.0, 0.6, 48]} />
        <meshStandardMaterial color="#FFF8EF" roughness={0.55} />
      </mesh>
      {/* Icing swirl */}
      <mesh position={[0, 0.45, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.55, 0.16, 24, 48]} />
        <meshStandardMaterial color="#C89B6B" roughness={0.4} />
      </mesh>
      {/* Strawberries around the swirl */}
      {Array.from({ length: STRAWBERRY_COUNT }, (_, i) => {
        const angle = (i / STRAWBERRY_COUNT) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.9, 0.4, Math.sin(angle) * 0.9]} castShadow>
            <sphereGeometry args={[0.14, 16, 16]} />
            <meshStandardMaterial color="#D1495B" roughness={0.5} />
          </mesh>
        );
      })}
      {/* Candle */}
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.5, 12]} />
        <meshStandardMaterial color="#F6C85F" />
      </mesh>
      <pointLight position={[0, 1.15, 0]} intensity={0.6} color="#FFD98E" distance={2} />
    </group>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/scene/cake-model.tsx
git commit -m "feat(scene): add procedural cake model (no external GLB asset)"
```

---

### Task 7: Scene canvas

**Files:**
- Create: `components/scene/scene-canvas.tsx`

**Interfaces:**
- Consumes: `CakeModel` (Task 6).
- Produces: `SceneCanvas()`. Consumed by Task 9 (`scene-root.tsx`, via `next/dynamic`).

No automated test — verified by manual browser-verify below and in Task 13.

- [ ] **Step 1: Implement**

```tsx
// components/scene/scene-canvas.tsx
"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr } from "@react-three/drei";

import { CakeModel } from "./cake-model";

// No drei <Environment> HDRI here on purpose — it fetches a preset texture
// from a CDN at runtime, which would reintroduce the exact external-asset
// dependency the spec ruled out for the cake model itself. Plain
// ambient/directional/point lights (the point light lives in CakeModel) are
// enough for a stylized procedural scene.
export function SceneCanvas() {
  return (
    <div data-testid="scene-canvas" aria-hidden="true" className="fixed inset-0 -z-10">
      <Canvas camera={{ position: [0, 1.2, 5], fov: 40 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <AdaptiveDpr />
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 4, 2]} intensity={1.1} castShadow />
        <Suspense fallback={null}>
          <CakeModel />
        </Suspense>
      </Canvas>
    </div>
  );
}
```

- [ ] **Step 2: Manual browser-verify (first real render of the 3D layer)**

Run: `pnpm dev`, open `http://localhost:3000`. This component isn't wired into the layout yet (Task 9 does that) — for now just confirm:

Run: `pnpm typecheck`
Expected: PASS, no import/type errors from `@react-three/fiber`/`@react-three/drei` JSX intrinsics (`<mesh>`, `<Canvas>`, etc.)

- [ ] **Step 3: Commit**

```bash
git add components/scene/scene-canvas.tsx
git commit -m "feat(scene): add R3F canvas with lighting rig and adaptive DPR"
```

---

### Task 8: Scroll controller

**Files:**
- Create: `components/scene/scene-controller.tsx`

**Interfaces:**
- Consumes: `computeSceneTransform` (Task 2), `useSceneStore` (Task 3), `useScroll`/`useMotionValueEvent` from `motion/react`.
- Produces: `SceneController()` — mounting it sets `stage: "hero"` and starts driving the transform from page scroll; unmounting resets `stage: "ambient"`. Consumed by Task 9, which mounts it only while on the homepage.

No automated test — `useScroll` needs a real DOM/scroll container. Verified by manual browser-verify in Task 13 (scroll the homepage, confirm the cake visibly moves).

- [ ] **Step 1: Implement**

```tsx
// components/scene/scene-controller.tsx
"use client";

import { useEffect } from "react";
import { useMotionValueEvent, useScroll } from "motion/react";

import { computeSceneTransform } from "@/lib/scene/transform";
import { useSceneStore } from "@/lib/store/scene";

/** Mounted only on the homepage (see scene-root.tsx) — drives the scene
 *  transform from whole-page scroll progress for the duration it's mounted. */
export function SceneController() {
  const { scrollYProgress } = useScroll();
  const setTransform = useSceneStore((s) => s.setTransform);
  const setStage = useSceneStore((s) => s.setStage);

  useEffect(() => {
    setStage("hero");
    return () => setStage("ambient");
  }, [setStage]);

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    setTransform(computeSceneTransform(progress, "hero"));
  });

  return null;
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/scene/scene-controller.tsx
git commit -m "feat(scene): drive scene transform from homepage scroll progress"
```

---

### Task 9: Scene root composition + mount in layout

**Files:**
- Create: `components/scene/scene-root.tsx`
- Modify: `app/[locale]/layout.tsx:125-154`

**Interfaces:**
- Consumes: `useReducedMotion`, `useWebglSupport` (Task 4), `SceneErrorBoundary`, `SceneFallback` (Task 5), `SceneController` (Task 8), `usePathname` from `@/i18n/navigation`.
- Produces: `SceneRoot({ posterUrl?: string })` — the single component the layout mounts. This is the last new file; everything else composes here.

No automated test for the component itself — covered by the Playwright spec in Task 12 and manual browser-verify in Task 13.

- [ ] **Step 1: Implement `scene-root.tsx`**

`SceneCanvas` is dynamically imported with `ssr: false` so the R3F/three bundle never ships in the initial server-rendered HTML or blocks the homepage's LCP.

```tsx
// components/scene/scene-root.tsx
"use client";

import dynamic from "next/dynamic";

import { usePathname } from "@/i18n/navigation";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useWebglSupport } from "@/hooks/use-webgl-support";
import { SceneController } from "./scene-controller";
import { SceneErrorBoundary } from "./scene-error-boundary";
import { SceneFallback } from "./scene-fallback";

const SceneCanvas = dynamic(() => import("./scene-canvas").then((m) => m.SceneCanvas), { ssr: false });

export function SceneRoot({ posterUrl }: { posterUrl?: string }) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const webglSupported = useWebglSupport();
  const canRender3D = webglSupported && !reducedMotion;
  const isHome = pathname === "/";

  return (
    <>
      {canRender3D ? (
        <SceneErrorBoundary fallback={<SceneFallback posterUrl={posterUrl} />}>
          <SceneCanvas />
        </SceneErrorBoundary>
      ) : (
        <SceneFallback posterUrl={posterUrl} />
      )}
      {isHome && canRender3D ? <SceneController /> : null}
    </>
  );
}
```

- [ ] **Step 2: Mount it in the shared layout**

Read `app/[locale]/layout.tsx:108-154` first to confirm line numbers haven't shifted, then apply:

```diff
--- a/app/[locale]/layout.tsx
+++ b/app/[locale]/layout.tsx
@@
 import { CartHydration } from "@/components/cart/cart-hydration";
 import { ThemePreviewListener } from "@/components/theme/theme-preview-listener";
 import { Toaster } from "@/components/ui/sonner";
+import { SceneRoot } from "@/components/scene/scene-root";
```

```diff
@@
       <body className="flex min-h-full flex-col">
+        <SceneRoot posterUrl={theme?.hero.image_url} />
         <NextIntlClientProvider>
```

- [ ] **Step 3: Manual browser-verify**

Run: `pnpm dev`, open `http://localhost:3000`.
Expected: a `<canvas>` element is present (inspect via devtools), a rotating cake is visible behind the hero content, no console errors. Navigate to `/san-pham` via the header nav — the canvas must **not** disappear/flash/reinitialize; it should settle into its static ambient pose. Scroll the homepage — camera/cake should visibly respond within ~1 frame of lag (the 0.06 lerp factor in Task 6).

- [ ] **Step 4: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/scene/scene-root.tsx "app/[locale]/layout.tsx"
git commit -m "feat(scene): mount persistent 3D scene layer in the shared layout"
```

---

### Task 10: Premium bakery theme defaults

**Files:**
- Modify: `lib/theme/presets.ts:12-78`
- Modify: `lib/theme/default-theme.ts:7-50`

**Interfaces:**
- No new exports — same `THEME_PRESETS` array shape and `DEFAULT_THEME: ThemeData` shape as before, only values change.

- [ ] **Step 1: Add the new preset**

In `lib/theme/presets.ts`, insert a new entry as the **first** item of `THEME_PRESETS` (existing 5 presets stay, unchanged, just shifted down):

```ts
  {
    name: "Bánh ngọt cao cấp",
    colors: {
      primary: "#C89B6B",
      secondary: "#F3E4D0",
      accent: "#5C3A21",
      background: "#FFFBF5",
      foreground: "#3A2A1D",
      muted: "#EFE3D3",
      success: "#8BC79A",
      destructive: "#E76A6A",
    },
  },
```

- [ ] **Step 2: Point `DEFAULT_THEME` at the same palette, fonts, and storytelling section order**

In `lib/theme/default-theme.ts`, replace the `colors`, `fonts`, and `sections` fields (lines 8-38):

```ts
  colors: {
    primary: "#C89B6B",
    secondary: "#F3E4D0",
    accent: "#5C3A21",
    background: "#FFFBF5",
    foreground: "#3A2A1D",
    muted: "#EFE3D3",
    success: "#8BC79A",
    destructive: "#E76A6A",
  },
  radius: "1.5rem",
  fonts: { heading: "Playfair Display", body: "Be Vietnam Pro" },
  hero: {
    variant: "pastel-3d",
    title: { vi: "Bánh kem tươi mỗi ngày, ngọt ngào mỗi khoảnh khắc", en: "Fresh cakes every day" },
    subtitle: { vi: "Đặt bánh online, giao tận nơi trong 2 giờ", en: "Order online, delivered in 2 hours" },
    image_url: "https://picsum.photos/seed/bakery-hero/1200/900",
    cta: { label: { vi: "Đặt bánh ngay" }, href: "/san-pham" },
  },
  sections: [
    { key: "hero", enabled: true, order: 1 },
    { key: "featured", enabled: true, order: 2, props: { limit: 8 } },
    { key: "story", enabled: true, order: 3 },
    { key: "categories", enabled: true, order: 4 },
    { key: "custom_cake", enabled: true, order: 5 },
    { key: "best_sellers", enabled: true, order: 6 },
    { key: "testimonials", enabled: true, order: 7 },
    { key: "blog", enabled: false, order: 8 },
    { key: "instagram", enabled: false, order: 9 },
    { key: "newsletter", enabled: true, order: 10 },
  ],
```

(`title`/`subtitle`/`cta`/`effects`/`announcement_bar` text stays exactly as-is — no copy changes, no new i18n keys.)

- [ ] **Step 2b: Also preload `Playfair Display` (now the default heading font)**

Currently only `Baloo 2`/`Be Vietnam Pro` are preloaded (`app/[locale]/layout.tsx:38-77`, per the Phase 7 perf comment there) because they were the seeded default. Since `Playfair Display` becomes the new default heading font, swap which two fonts preload — in `app/[locale]/layout.tsx`, change:

```diff
 const baloo2 = Baloo_2({
   variable: "--font-baloo-2",
   subsets: ["vietnamese", "latin"],
   weight: ["500", "600", "700", "800"],
   display: "swap",
+  preload: false,
 });
 const beVietnamPro = Be_Vietnam_Pro({
   variable: "--font-be-vietnam-pro",
   subsets: ["vietnamese", "latin"],
   weight: ["400", "500", "600", "700"],
   display: "swap",
 });
```

```diff
 const playfairDisplay = Playfair_Display({
   variable: "--font-playfair-display",
   subsets: ["vietnamese", "latin"],
   weight: ["500", "600", "700"],
   display: "swap",
-  preload: false,
 });
```

- [ ] **Step 3: Apply the new default to the live database row**

`DEFAULT_THEME` is only used by `scripts/seed.ts` and the Theme Editor's "Khôi phục mặc định" (reset-to-default) button — changing the TypeScript constant does **not** change what's already stored in Supabase. Do **not** re-run `pnpm seed` (it seeds sample products/orders too, not just the theme, and reseeding a live Supabase project is out of scope here). Instead:

1. `pnpm dev`, log into `/admin/login`.
2. Go to `/admin/giao-dien`.
3. Click "Khôi phục mặc định" (restore default) — this writes the new `DEFAULT_THEME` into the `bakery` table's `theme` row.
4. Confirm the preview updates to the caramel/cream/chocolate palette and Playfair Display heading.
5. Click "Lưu" (save) to persist.

- [ ] **Step 4: Verify contrast**

Run: `pnpm dev`, open `http://localhost:3000`, run the existing accessibility check:

Run: `pnpm e2e tests/e2e/06-accessibility.spec.ts`
Expected: PASS — this file already scans `/` (and 9 other customer pages) for WCAG AA violations, so the new palette gets checked automatically without a new test file.

- [ ] **Step 5: Commit**

```bash
git add lib/theme/presets.ts lib/theme/default-theme.ts "app/[locale]/layout.tsx"
git commit -m "feat(theme): add premium bakery preset as new default palette/fonts/order"
```

---

### Task 11: Hero section redesign

**Files:**
- Modify: `components/home/hero-section.tsx` (full-file replacement, was 77 lines)

**Interfaces:**
- No signature change: still `HeroSection({ hero, locale }: { hero: ThemeData["hero"]; locale: Locale })`, still called the same way from `components/home/home-sections.tsx:38`.

- [ ] **Step 1: Replace the file**

Drops the static `hero.image_url` `<Image>`/`<Tilt3D>` block (the 3D canvas behind it is now the hero visual — the image is repurposed as `SceneFallback`'s poster in Task 5/9), and switches to a single centered column so the 3D scene has room to read on both sides.

```tsx
// components/home/hero-section.tsx
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { t as tField } from "@/lib/i18n/text";
import type { ThemeData } from "@/lib/bakery/schemas";
import type { Locale } from "@/lib/bakery/types";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";
import { Marquee } from "@/components/motion/marquee";

export async function HeroSection({ hero, locale }: { hero: ThemeData["hero"]; locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "Home" });

  return (
    <>
      <section className="relative flex min-h-[80vh] items-center overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-3xl text-center">
          <FadeIn>
            <h1 className="font-heading text-foreground text-4xl leading-tight font-semibold sm:text-5xl lg:text-6xl">
              {tField(hero.title, locale) || t("heroTitleFallback")}
            </h1>
            {hero.subtitle ? (
              <p className="text-muted-foreground mx-auto mt-4 max-w-md text-lg">{tField(hero.subtitle, locale)}</p>
            ) : null}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" className="shadow-lift rounded-full px-8 active:scale-[0.96]" asChild>
                <Link href={hero.cta?.href ?? "/san-pham"}>
                  {hero.cta ? tField(hero.cta.label, locale) : t("heroCtaFallback")}
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8" asChild>
                <Link href="/san-pham">{t("viewMenu")}</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      <div className="bg-secondary/50 border-border text-foreground border-y py-3">
        <Marquee className="text-sm font-medium">
          <span className="px-4">{t("marqueeFresh")}</span>
          <span className="px-4">•</span>
          <span className="px-4">{t("marqueeDelivery")}</span>
          <span className="px-4">•</span>
          <span className="px-4">{t("marqueeCustomCake")}</span>
          <span className="px-4">•</span>
        </Marquee>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS — confirms the removed `Image`/`Tilt3D` imports don't leave unused-import errors elsewhere (they don't; both were only used in this file).

- [ ] **Step 3: Manual browser-verify**

Run: `pnpm dev`, open `http://localhost:3000`. Confirm: hero text is centered, readable over the 3D scene, CTA buttons are clickable and navigate correctly, no layout shift/overflow at 360px width (resize devtools).

- [ ] **Step 4: Commit**

```bash
git add components/home/hero-section.tsx
git commit -m "refactor(home): redesign hero to single centered column over the 3D scene"
```

---

### Task 12: E2E coverage for the 3D layer

**Files:**
- Create: `tests/e2e/07-scene-3d.spec.ts`

**Interfaces:**
- Consumes: `data-testid="scene-canvas"` (Task 7), `data-testid="scene-fallback"` (Task 5) as selectors.

- [ ] **Step 1: Write the spec**

Follows the existing pattern in `tests/e2e/06-accessibility.spec.ts` (same `waitForPageSettled` need for the `<FadeIn>` hero text, same `page.emulateMedia` usage for reduced motion).

```ts
// tests/e2e/07-scene-3d.spec.ts
import { test, expect } from "@playwright/test";

test("homepage mounts the 3D canvas and the hero CTA stays clickable", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("scene-canvas")).toBeVisible();
  const cta = page.getByRole("link", { name: /đặt bánh ngay/i }).first();
  await expect(cta).toBeVisible();
  await cta.click();
  await expect(page).toHaveURL(/\/san-pham/);
});

test("prefers-reduced-motion: reduce shows the static fallback instead of the canvas", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByTestId("scene-fallback")).toBeVisible();
  await expect(page.getByTestId("scene-canvas")).toHaveCount(0);
});

test("navigating from home to another route keeps the layout intact (no blank/broken canvas layer)", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("scene-canvas")).toBeVisible();
  await page.getByRole("link", { name: /xem thực đơn|san phẩm/i }).first().click();
  await expect(page).toHaveURL(/\/san-pham/);
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(hasOverflow).toBe(false);
  await expect(page.locator("main")).toBeVisible();
});
```

- [ ] **Step 2: Run it**

Run: `pnpm e2e tests/e2e/07-scene-3d.spec.ts`
Expected: PASS (3 tests). If the CTA/menu link text selectors don't match (copy may differ slightly), open `messages/vi.json`'s `Home` namespace to confirm `heroCtaFallback`/`viewMenu` strings and adjust the regex to match exactly.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/07-scene-3d.spec.ts
git commit -m "test(e2e): cover 3D scene mount, reduced-motion fallback, and route persistence"
```

---

### Task 13: Full verification, Lighthouse check, and progress notes

**Files:**
- Modify: `CLAUDE.md` (append Phase progress note — follow the existing style of prior phase entries)

- [ ] **Step 1: Full production build and start**

```bash
pnpm build
pnpm start
```

Expected: clean build, no errors. Open `http://localhost:3000` in a real browser, check devtools console for zero errors/warnings.

- [ ] **Step 2: Run the entire automated suite**

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm e2e
```

Expected: all green — typecheck/lint clean, Vitest (previous 49 + 9 new from Tasks 2-3), Playwright (previous 31 + 3 new from Task 12).

- [ ] **Step 3: Lighthouse mobile audit on the homepage**

With `pnpm start` still running, open Chrome DevTools → Lighthouse → Mobile → run against `http://localhost:3000`. Compare against the Phase 7 baseline already recorded in `CLAUDE.md` (Performance 80, LCP 4.0s).
- If Performance ≥ 78 and LCP ≤ 4.5s: acceptable, proceed.
- If it regressed more than that: check the Network tab for the `SceneCanvas` chunk loading eagerly instead of lazily (confirms Task 9's `next/dynamic` is working) before accepting the regression — do not silently accept a bigger drop without investigating this specific cause first.

- [ ] **Step 4: Manual cross-cutting browser-verify**

In a real browser (not just Playwright headless):
- Resize to 360px, 768px, 1024px, 1440px — no horizontal overflow, cake scene doesn't overlap/obscure any text or button.
- macOS/Windows OS-level "reduce motion" toggle (or Chrome DevTools → Rendering → Emulate CSS `prefers-reduced-motion`) — confirms canvas is fully replaced by the static fallback, no residual animation.
- Add a product to cart, go through `/gio-hang` → `/thanh-toan` — confirms checkout flow is completely unaffected by the new layout-level `SceneRoot` mount.
- Log into `/admin/login`, open `/admin/giao-dien` preview iframe (`?preview=1`) — confirms the 3D canvas doesn't break or slow down the existing Theme Editor preview.

- [ ] **Step 5: Update `CLAUDE.md` progress**

Append a new checklist entry under "Tiến độ theo phase" documenting: R3F/drei added, procedural cake (no GLB), persistent scene layer via shared layout, premium bakery default preset, hero redesign, Lighthouse before/after numbers from Step 3, and that product-card/checkout/per-route storytelling are explicitly deferred (reference this plan's file path).

- [ ] **Step 6: Final commit**

```bash
git add CLAUDE.md
git commit -m "docs: record sub-project 1 (3D homepage hero) completion in project progress notes"
```
