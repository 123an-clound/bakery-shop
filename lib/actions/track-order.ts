"use server";

import { z } from "zod";

import { getOrderByCodeAndPhone } from "@/lib/bakery/orders";
import type { OrderData } from "@/lib/bakery/schemas";

const inputSchema = z.object({
  code: z.string().trim().min(1),
  last4Phone: z.string().regex(/^\d{4}$/),
});

export interface TrackedOrder {
  code: string;
  status: string;
  deliveryAt: string;
  total: number;
  timeline: OrderData["timeline"];
}

export interface TrackOrderState {
  status: "idle" | "success" | "error";
  order?: TrackedOrder;
  message?: string;
}

/** muc 6.3 checklist: tra cuu don hang bat buoc kem 4 so cuoi dien thoai (chong do ma don / IDOR). */
export async function trackOrder(
  _prevState: TrackOrderState,
  formData: FormData,
): Promise<TrackOrderState> {
  const parsed = inputSchema.safeParse({
    code: formData.get("code"),
    last4Phone: formData.get("last4Phone"),
  });
  if (!parsed.success) {
    return { status: "error", message: "not_found" };
  }

  const order = await getOrderByCodeAndPhone(parsed.data.code, parsed.data.last4Phone);
  if (!order) {
    return { status: "error", message: "not_found" };
  }

  return {
    status: "success",
    order: {
      code: order.data.code,
      status: order.status,
      deliveryAt: order.data.delivery_at,
      total: order.data.total,
      timeline: order.data.timeline,
    },
  };
}
