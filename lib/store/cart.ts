import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { z } from "zod";

const persistedCartSchema = z.object({
  items: z.array(z.object({
    lineId: z.string(), productId: z.number().int().positive(), slug: z.string(), name: z.string(), image: z.string().optional(),
    unitPrice: z.number().int().nonnegative().safe(), qty: z.number().int().min(1).max(50),
    options: z.record(z.string(), z.string()), prepTimeHours: z.number().int().nonnegative().optional(),
  })).max(50),
  couponCode: z.string().nullable().default(null), couponDiscount: z.number().nonnegative().default(0),
});

export interface CartItem {
  /** `${productId}::${sorted options}` — same product+options merges qty instead of duplicating. */
  lineId: string;
  productId: number;
  slug: string;
  name: string;
  image?: string;
  unitPrice: number;
  prepTimeHours?: number;
  qty: number;
  options: Record<string, string>;
}

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  couponDiscount: number;
  addItem: (item: Omit<CartItem, "lineId" | "qty">, qty?: number) => void;
  removeItem: (lineId: string) => void;
  setQty: (lineId: string, qty: number) => void;
  setCoupon: (code: string | null, discount: number) => void;
  clear: () => void;
  updatePrices: (prices: Array<{ productId: number; options: Record<string, string>; unitPrice: number }>) => void;
}

export function makeLineId(productId: number, options: Record<string, string>): string {
  const sortedOptions = Object.entries(options)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  return `${productId}::${sortedOptions}`;
}

/**
 * `skipHydration: true` — rehydration from localStorage is triggered manually
 * by <CartHydration /> inside a useEffect (see components/cart/cart-hydration.tsx),
 * so the store's first client render matches the server's empty-cart render
 * and doesn't hit the classic Zustand+Next.js hydration mismatch.
 */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      couponDiscount: 0,
      addItem: (item, qty = 1) => {
        if (!Number.isInteger(qty) || qty < 1) return;
        const lineId = makeLineId(item.productId, item.options);
        const existing = get().items.find((i) => i.lineId === lineId);
        if (existing) {
          set({
            items: get().items.map((i) => (i.lineId === lineId ? { ...i, ...item, qty: Math.min(50, i.qty + qty) } : i)),
          });
        } else {
          set({ items: [...get().items, { ...item, lineId, qty: Math.min(50, qty) }] });
        }
      },
      removeItem: (lineId) => set({ items: get().items.filter((i) => i.lineId !== lineId) }),
      setQty: (lineId, qty) => {
        if (!Number.isInteger(qty)) return;
        if (qty <= 0) {
          get().removeItem(lineId);
          return;
        }
        set({ items: get().items.map((i) => (i.lineId === lineId ? { ...i, qty: Math.min(50, qty) } : i)) });
      },
      setCoupon: (code, discount) => set({ couponCode: code, couponDiscount: discount }),
      clear: () => set({ items: [], couponCode: null, couponDiscount: 0 }),
      updatePrices: (prices) => set({ items: get().items.map(item => {
        const price = prices.find(p => makeLineId(p.productId, p.options) === item.lineId);
        return price ? { ...item, unitPrice: price.unitPrice } : item;
      }) }),
    }),
    {
      name: "bakery-cart",
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          try { const value = localStorage.getItem(name); if (value) JSON.parse(value); return value; }
          catch { return null; }
        },
        setItem: (name, value) => { try { localStorage.setItem(name, value); } catch { /* cart still works in memory */ } },
        removeItem: (name) => { try { localStorage.removeItem(name); } catch { /* storage may be disabled */ } },
      })),
      merge: (persisted, current) => {
        const parsed = persistedCartSchema.safeParse(persisted);
        return parsed.success ? { ...current, ...parsed.data, items: parsed.data.items.map(item => ({ ...item, lineId: makeLineId(item.productId, item.options) })) } : current;
      },
      skipHydration: true,
    },
  ),
);

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.qty, 0);
}
