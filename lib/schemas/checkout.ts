import { z } from "zod";

/** Client-side form schema — the server independently re-validates + repricess everything in POST /api/orders. */
export const checkoutFormSchema = z.object({
  customerName: z.string().trim().min(1, "Vui lòng nhập họ tên"),
  phone: z.string().regex(/^0\d{9}$/, "Số điện thoại không hợp lệ (VD: 0912345678)"),
  email: z.union([z.email("Email không hợp lệ"), z.literal("")]),
  addressLine: z.string().trim().min(1, "Vui lòng nhập địa chỉ"),
  ward: z.string().trim().optional(),
  district: z.string().trim().optional(),
  city: z.string().trim().min(1, "Vui lòng nhập tỉnh/thành phố"),
  deliveryAt: z.string().min(1, "Vui lòng chọn thời gian nhận"),
  note: z.string().max(500).optional(),
  paymentMethod: z.enum(["cod", "bank_transfer"]),
});

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
