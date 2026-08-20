"use server";

import { z } from "zod";

import { createBakeryRow } from "@/lib/bakery/mutations";
import { getPrivateNotifyEmails } from "@/lib/bakery/settings-private";
import { sendEmail } from "@/lib/email/client";
import { customCakeRequestEmail } from "@/lib/email/templates";

const MIN_LEAD_HOURS = 24;

const inputSchema = z
  .object({
    customerName: z.string().trim().min(1).max(120),
    phone: z.string().regex(/^0\d{9}$/),
    email: z.email().optional().or(z.literal("")),
    size: z.string().trim().min(1),
    layers: z.coerce.number().int().min(1).max(10),
    sponge: z.string().trim().min(1),
    cream: z.string().trim().min(1),
    flavor: z.string().trim().min(1),
    messageOnCake: z.string().max(120).optional(),
    colorTheme: z.string().max(80).optional(),
    budget: z.coerce.number().nonnegative().optional(),
    needAt: z.string().min(1),
    referenceImages: z.array(z.url()).max(3).default([]),
    note: z.string().max(500).optional(),
  })
  .refine(
    (data) => new Date(data.needAt).getTime() - Date.now() >= MIN_LEAD_HOURS * 60 * 60 * 1000,
    { message: `need_at phai cach hien tai it nhat ${MIN_LEAD_HOURS} gio`, path: ["needAt"] },
  );

export interface CustomCakeState {
  status: "idle" | "success" | "error";
  message?: string;
}

export async function submitCustomCakeRequest(
  _prevState: CustomCakeState,
  formData: FormData,
): Promise<CustomCakeState> {
  const raw = {
    customerName: formData.get("customerName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    size: formData.get("size"),
    layers: formData.get("layers"),
    sponge: formData.get("sponge"),
    cream: formData.get("cream"),
    flavor: formData.get("flavor"),
    messageOnCake: formData.get("messageOnCake"),
    colorTheme: formData.get("colorTheme"),
    budget: formData.get("budget") || undefined,
    needAt: formData.get("needAt"),
    referenceImages: formData.getAll("referenceImages"),
    note: formData.get("note"),
  };

  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: "invalid_input" };
  }
  const input = parsed.data;

  await createBakeryRow({
    type: "custom_cake",
    status: "new",
    data: {
      customer_name: input.customerName,
      phone: input.phone,
      email: input.email || undefined,
      size: input.size,
      layers: input.layers,
      sponge: input.sponge,
      cream: input.cream,
      flavor: input.flavor,
      message_on_cake: input.messageOnCake,
      color_theme: input.colorTheme,
      budget: input.budget,
      need_at: new Date(input.needAt).toISOString(),
      reference_images: input.referenceImages,
      note: input.note,
    },
  });

  const notifyEmails = await getPrivateNotifyEmails();
  if (notifyEmails.length > 0) {
    await sendEmail({
      to: notifyEmails,
      subject: "Yêu cầu đặt bánh riêng mới",
      html: customCakeRequestEmail({
        customerName: input.customerName,
        phone: input.phone,
        size: input.size,
        needAt: input.needAt,
      }),
    });
  }

  return { status: "success" };
}
