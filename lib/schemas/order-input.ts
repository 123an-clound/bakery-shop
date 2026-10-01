import { z } from "zod";

export const orderInputSchema = z.object({
  requestId: z.uuid(),
  // A comparison only: prices are always recalculated from the database.
  expectedTotal: z.number().int().nonnegative().safe(),
  items: z.array(z.object({
    productId: z.number().int().positive().safe(),
    qty: z.number().int().min(1).max(50),
    options: z.record(z.string().max(80), z.string().max(120)).default({}),
  })).min(1).max(50),
  customerName: z.string().trim().min(1).max(120),
  phone: z.string().regex(/^0\d{9}$/),
  email: z.email().max(254).optional().or(z.literal("")),
  address: z.object({
    line: z.string().trim().min(1).max(300),
    ward: z.string().trim().max(120).optional(),
    district: z.string().trim().max(120).optional(),
    city: z.string().trim().min(1).max(120),
  }),
  deliveryAt: z.iso.datetime({ offset: true }),
  note: z.string().max(500).optional(),
  paymentMethod: z.enum(["cod", "bank_transfer"]),
  couponCode: z.string().trim().max(80).optional(),
});
export type OrderInput = z.infer<typeof orderInputSchema>;
