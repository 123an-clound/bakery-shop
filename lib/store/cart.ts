import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItem {
  /** `${productId}::${sorted options}` — same product+options merges qty instead of duplicating. */
  lineId: string;
  productId: number;
  slug: string;
  name: string;
  image?: string;
  unitPrice: number;
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
}

export function makeLineId(productId: number, options: Record<string, string>): string {
  const sortedOptions = Object.entries(options)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
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
        const lineId = makeLineId(item.productId, item.options);
        const existing = get().items.find((i) => i.lineId === lineId);
        if (existing) {
          set({
            items: get().items.map((i) => (i.lineId === lineId ? { ...i, qty: i.qty + qty } : i)),
          });
        } else {
          set({ items: [...get().items, { ...item, lineId, qty }] });
        }
      },
      removeItem: (lineId) => set({ items: get().items.filter((i) => i.lineId !== lineId) }),
      setQty: (lineId, qty) => {
        if (qty <= 0) {
          get().removeItem(lineId);
          return;
        }
        set({ items: get().items.map((i) => (i.lineId === lineId ? { ...i, qty } : i)) });
      },
      setCoupon: (code, discount) => set({ couponCode: code, couponDiscount: discount }),
      clear: () => set({ items: [], couponCode: null, couponDiscount: 0 }),
    }),
    {
      name: "bakery-cart",
      storage: createJSONStorage(() => localStorage),
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
