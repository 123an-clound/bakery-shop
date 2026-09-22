# 3D Premium Bakery — Trang chủ + lớp scene 3D xuyên route (Sub-project 1)

## Bối cảnh & phạm vi

Yêu cầu gốc của người dùng (xem lịch sử brainstorm) là chuyển toàn bộ website
tiệm bánh thành trải nghiệm 3D cinematic lấy cảm hứng từ spine.design (23 hạng
mục: hero 3D, scroll storytelling, product card 3D, checkout polish,
micro-interaction toàn site...). Phạm vi đó quá lớn cho 1 spec/plan.

**Spec này chỉ bao phủ sub-project 1** — đã được người dùng chốt qua brainstorm:

1. Redesign trang chủ (`/`) theo hướng premium bakery + hero 3D cinematic,
   scroll-driven.
2. Dựng lớp scene 3D **liên tục xuyên route** (mount 1 lần ở layout), nhưng
   chỉ trang chủ có choreography đầy đủ theo scroll — các route khác hiển thị
   scene ở trạng thái "ambient" tĩnh, không storytelling riêng.

**Ngoài phạm vi** (để lại cho sub-project sau, không làm trong lần này):
product card 3D tilt/quick-view nâng cao, checkout micro-interaction, storytelling
riêng cho từng route (san-pham, danh-muc, gio-hang...), particle nâng cao,
magnetic button toàn site. Component `Tilt3D` hiện có giữ nguyên, có thể tái sử
dụng nhẹ ở product-grid nhưng không mở rộng logic mới.

## Ràng buộc cứng (kế thừa từ CLAUDE.md dự án)

- Không tạo bảng dữ liệu mới, không đổi API/business logic hiện có (giỏ hàng,
  đặt hàng, checkout, auth... giữ nguyên 100%).
- **Không phá Theme Editor** (`/admin/giao-dien`) — cơ chế đổi màu/font/thứ tự
  section runtime không cần rebuild phải hoạt động y nguyên sau khi xong.
- Next.js 16 App Router, TypeScript strict + `noUncheckedIndexedAccess`,
  Server Component mặc định, chỉ thêm `'use client'` khi cần.
- Song ngữ VI/EN qua next-intl — mọi text hiển thị lấy từ `messages/*.json`,
  không hard-code trong JSX.
- `prefers-reduced-motion` phải được tôn trọng (điểm 39 `effects.reduced_motion_respect`
  đã có sẵn trong theme schema).

## Quyết định kiến trúc đã chốt

### 1. Canvas 3D mount 1 lần ở shared layout

`components/scene/scene-canvas.tsx` (client) chứa `<Canvas>` của
`@react-three/fiber`, mount **duy nhất 1 lần** trong `app/[locale]/layout.tsx`,
`position: fixed`, `z-index` thấp hơn nội dung, `pointer-events: none` (trừ
vùng hero bật `pointer-events-auto` cục bộ cho hover-tilt).

Next.js App Router không unmount layout khi điều hướng client-side trong cùng
segment `[locale]` → Canvas + WebGL context tồn tại xuyên suốt mọi trang public,
không bị huỷ-tạo lại → đáp ứng yêu cầu "không reset scene khi chuyển trang" mà
không cần cơ chế persistence tự chế.

### 2. Model bánh kem: procedural, không phụ thuộc asset GLB ngoài

`components/scene/cake-model.tsx` (client) dựng bánh kem cách điệu bằng
primitive của Three.js/drei: tầng bánh (cylinder/RoundedBox xếp chồng), kem phủ
(torus/sphere biến dạng nhẹ), dâu tây + chocolate chip (instancedMesh, số lượng
giảm trên mobile), nến (cylinder mảnh + point light nhỏ). Không tải file GLB
ngoài → không rủi ro license, không cần bước tối ưu Draco/Meshopt, dựng nhanh,
dễ chỉnh sửa hình dáng bằng code.

### 3. Palette/typography: cập nhật default theme, không hardcode song song

Không tạo hệ màu cứng độc lập với Theme Editor. Sửa `DEFAULT_THEME` trong
`lib/theme/default-theme.ts` (và preset tương ứng trong `lib/theme/presets.ts`
nếu áp dụng) sang bảng màu "premium bakery":

```ts
colors: {
  primary: "#C89B6B",     // caramel
  secondary: "#F3E4D0",   // kem/trắng ngà
  accent: "#5C3A21",      // chocolate đậm
  background: "#FFFBF5",  // trắng ngà nền
  foreground: "#3A2A1D",  // chữ chính, đủ contrast trên background
  muted: "#EFE3D3",
  success: "#8BC79A",     // giữ nguyên — không phải yêu cầu đổi
  destructive: "#E76A6A", // giữ nguyên
}
fonts: { heading: "Playfair Display", body: "Be Vietnam Pro" }
```

Contrast của mọi cặp màu/nền phải đạt WCAG AA (≥4.5:1 text thường, ≥3:1 text
lớn) — verify bằng axe trước khi coi là xong; rút kinh nghiệm lỗi Phase 7
(`text-primary` từng bị dùng sai làm màu chữ chỉ 1.75-2.19:1).

Theme Editor **vẫn đọc/ghi đúng 8 field màu này như cũ** — chủ tiệm có thể đổi
lại bất cứ lúc nào qua UI hiện có, không có thay đổi schema.

### 4. Thứ tự section trang chủ theo storytelling

Chỉ đổi **giá trị `order` mặc định** trong `DEFAULT_THEME.sections`, không đổi
cơ chế kéo-thả/bật-tắt của Theme Editor (admin vẫn tự sắp xếp lại được sau):

| order | key | vai trò storytelling |
|---|---|---|
| 1 | `hero` | Mở đầu — hero 3D cinematic |
| 2 | `featured` | Sản phẩm signature |
| 3 | `story` | Nguyên liệu + quy trình + thương hiệu |
| 4 | `categories` | Bộ sưu tập bánh theo danh mục |
| 5 | `custom_cake` | Đặt bánh theo yêu cầu |
| 6 | `best_sellers` | Bán chạy |
| 7 | `testimonials` | Review khách hàng |
| 8 | `newsletter` | CTA kết |

`blog`, `instagram` giữ `enabled: false` như hiện tại (không trong luồng
storytelling chính).

### 5. State quản lý scene

`lib/store/scene.ts` — zustand store **không persist** (khác với cart store —
đây là state dẫn xuất từ scroll/route, không phải dữ liệu người dùng cần giữ
qua session):

```ts
type SceneStage = "hero" | "ambient";
type SceneState = {
  stage: SceneStage;
  cameraTarget: [number, number, number];
  objectRotation: [number, number, number];
  objectPosition: [number, number, number];
  lightIntensity: number;
  sceneReady: boolean;
  setStage: (s: SceneStage) => void;
  setTransform: (t: Partial<Pick<SceneState,
    "cameraTarget" | "objectRotation" | "objectPosition" | "lightIntensity">>) => void;
  setReady: (r: boolean) => void;
};
```

`lib/scene/transform.ts` — hàm thuần `computeSceneTransform(progress: number,
stage: SceneStage)` map scroll-progress (0-1, từ `motion`'s `useScroll` trong
`HeroSection`/`ScrollProgressSection` của trang chủ) sang giá trị camera/object/
light. Tách khỏi component để test được bằng Vitest mà không cần DOM/WebGL.

`components/scene/scene-controller.tsx` (client, đặt trong cây trang chủ) —
subscribe `useScroll`, gọi `computeSceneTransform`, ghi vào store qua
`setTransform`. Route khác **không mount controller này** → store giữ nguyên
giá trị cuối cùng từ lần rời trang chủ, `stage` chuyển `'ambient'` (scene co
nhỏ, mờ, góc dưới, tĩnh) qua 1 effect ngắn ở layout dựa trên `pathname`.

### 6. Fallback & error handling

- Guard mount: không có `WebGL2RenderingContext`
  (`hooks/use-webgl-support.ts`), hoặc `prefers-reduced-motion: reduce`
  (`hooks/use-reduced-motion.ts`, dùng `useSyncExternalStore` — cùng pattern
  Phase 2 đã dùng sửa lỗi hydration cho `lenis-provider`/`announcement-bar`,
  giờ tách thành hook dùng chung cho các call site 3D mới; không đụng code cũ),
  hoặc mobile yếu (`viewport < 768px && navigator.hardwareConcurrency <= 4`)
  → không mount `<Canvas>`, chỉ render `components/scene/scene-fallback.tsx`
  (ảnh poster tĩnh + blob CSS, dùng lại `FadeIn`/gradient token hiện có).
  Nhị phân bật/tắt — không làm hệ thống "giảm chất lượng dần" nhiều cấp.
- `<Canvas>` bọc trong React Error Boundary riêng
  (`components/scene/scene-error-boundary.tsx`) — lỗi runtime WebGL/context
  mất → fallback về `SceneFallback`, không crash layout, log lỗi qua
  `console.error` (không có Sentry trong dự án, không thêm mới).
- `SceneCanvas` import bằng `next/dynamic(..., { ssr: false })` — không chặn
  SSR/LCP của nội dung không phải 3D, tách bundle 3D khỏi bundle chính.

## Component list (file mới)

| File | Loại | Trách nhiệm |
|---|---|---|
| `components/scene/scene-canvas.tsx` | client | `<Canvas>` R3F, lighting rig, adaptive DPR |
| `components/scene/cake-model.tsx` | client | Bánh kem procedural, nhận transform qua props/store selector |
| `components/scene/scene-controller.tsx` | client | Đọc scroll trang chủ → ghi store |
| `components/scene/scene-fallback.tsx` | client | Poster/blob tĩnh khi không render 3D |
| `components/scene/scene-error-boundary.tsx` | client | Bắt lỗi runtime Canvas |
| `lib/store/scene.ts` | — | Zustand store (không persist) |
| `lib/scene/transform.ts` | — | Hàm thuần scroll→transform (test được) |
| `hooks/use-reduced-motion.ts` | client hook | matchMedia qua `useSyncExternalStore` |
| `hooks/use-webgl-support.ts` | client hook | Check WebGL2 một lần |

File sửa: `app/[locale]/layout.tsx` (mount canvas), `components/home/hero-section.tsx`
(gắn `SceneController`, redesign copy/typography theo palette mới),
`lib/theme/default-theme.ts` + `lib/theme/presets.ts` (palette/order),
`components/home/*-section.tsx` (áp token màu/spacing mới, không đổi logic
data-fetching).

## Dependency mới

`@react-three/fiber`, `@react-three/drei` — cần thiết cho scene 3D, chưa có
lib 3D nào trong project. **Không thêm GSAP** — scroll-drive dùng
`motion`'s `useScroll`/`useTransform` đã có sẵn trong `dependencies`, tránh
2 lib cùng vai trò scroll-animation.

## Testing & Definition of Done

- **Unit (Vitest):** `lib/scene/transform.test.ts` (map progress/stage →
  transform, các mốc biên 0/0.5/1), `lib/store/scene.test.ts` (setter cơ
  bản). Không viết unit test cho `cake-model.tsx`/`scene-canvas.tsx` (R3F +
  jsdom không có giá trị) — verify bằng browser thật.
- **E2E (Playwright, file mới `tests/e2e/07-scene-3d.spec.ts`):**
  - Canvas mount ở `/`, hero CTA vẫn click được và điều hướng đúng.
  - Emulate `prefers-reduced-motion: reduce` → không render canvas, thấy
    `scene-fallback`.
  - Điều hướng `/` → `/san-pham` → không có canvas trắng/vỡ layout, nội dung
    trang sản phẩm không bị che.
  - 31 test e2e hiện có phải tiếp tục xanh (không regress).
- **Accessibility:** chạy lại axe trên trang chủ với theme mới; contrast mọi
  cặp text/nền đạt AA.
- **Performance:** đo Lighthouse mobile trang chủ trước/sau. Không được tệ
  hơn baseline hiện tại đã ghi trong `CLAUDE.md` (Performance 80, LCP 4.0s)
  trừ khi nêu rõ lý do + hướng khắc phục trong báo cáo hoàn thành.
- **Browser-verify thủ công (bắt buộc theo Frontend DoD của dự án):** scroll
  mượt trang chủ, không console error, responsive 360/768/1024/1440px, toggle
  OS-level reduced-motion tắt hẳn chuyển động camera, cart/checkout/form ở
  các route khác hoạt động y nguyên như trước khi đổi.
- **DoD đóng sub-project 1:** `pnpm build && pnpm start` sạch → toàn bộ
  Playwright (cũ 31 + mới) + Vitest (cũ 49 + mới) + typecheck + lint xanh →
  axe pass → Lighthouse không regress (hoặc có lý do) → kiểm thử tay đủ 4 mục
  trên → cập nhật tiến độ vào `CLAUDE.md`.

## Rủi ro & lưu ý

- R3F/drei là dependency mới khá nặng (~150-200KB gzip) — bắt buộc dynamic
  import `ssr:false` + code-split để không kéo LCP trang chủ xuống, đã ghi ở
  mục Fallback.
- Bánh kem procedural sẽ không "ảnh thật" bằng GLB model chuyên nghiệp — chấp
  nhận đánh đổi (đã chốt ở brainstorm) để tránh rủi ro license/asset pipeline;
  có thể thay bằng GLB thật ở sub-project sau nếu chủ tiệm có ngân sách thuê
  3D artist.
- Theme Editor preview iframe (`?preview=1`) hiện có — cần xác nhận Canvas 3D
  không gây lỗi/nặng bất thường khi chạy trong iframe preview đó (kiểm thử tay
  thêm 1 bước ở admin, không phải hạng mục core nhưng phải không vỡ).
