"use server";

import { updateTag } from "next/cache";
import { z } from "zod";

import { createBakeryRow } from "@/lib/bakery/mutations";

const submitReviewInputSchema = z.object({
  productId: z.number().int().positive(),
  author: z.string().trim().min(1).max(80),
  rating: z.coerce.number().int().min(1).max(5),
  content: z.string().trim().min(5).max(2000),
});

export interface SubmitReviewState {
  status: "idle" | "success" | "error";
  message?: string;
}

/**
 * New reviews land as `status: "pending"` — RLS's `bakery_select` policy
 * only exposes `status: "approved"` reviews publicly, so a submitted review
 * is invisible until an admin approves it (Phase 6 mục 9.9). No rating
 * client-trust: `rating_avg`/`rating_count` on the product are recomputed
 * by the admin approval action, never by this submission.
 */
export async function submitReview(
  _prevState: SubmitReviewState,
  formData: FormData,
): Promise<SubmitReviewState> {
  const parsed = submitReviewInputSchema.safeParse({
    productId: Number(formData.get("productId")),
    author: formData.get("author"),
    rating: formData.get("rating"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Vui long dien day du va hop le cac truong." };
  }

  try {
    await createBakeryRow({
      type: "review",
      status: "pending",
      parentId: parsed.data.productId,
      data: {
        author: parsed.data.author,
        rating: parsed.data.rating,
        content: parsed.data.content,
      },
    });
  } catch {
    return { status: "error", message: "Co loi xay ra, vui long thu lai sau." };
  }

  // Note: a pending review is invisible to anon reads (RLS only exposes
  // `approved`), so this doesn't actually change what the submitter sees —
  // still correct to invalidate in case an admin views this same session.
  updateTag("reviews");
  return { status: "success", message: "Cam on ban da danh gia! Danh gia se hien thi sau khi duoc duyet." };
}
