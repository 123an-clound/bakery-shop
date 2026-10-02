import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth/require-admin";
import { customCakeDataSchema } from "@/lib/bakery/schemas";
import { createAdminClient } from "@/lib/supabase/admin";

const PRIVATE_BUCKET = "custom-cake-private";
const PRIVATE_KEY = /^custom-cake\/[0-9a-f-]{36}\.(?:webp|png|jpe?g|avif)$/i;

function unavailable() {
  return new NextResponse(null, {
    status: 404,
    headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; index: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const { id: idParam, index: indexParam } = await params;
  const id = Number(idParam);
  const index = Number(indexParam);
  if (!Number.isSafeInteger(id) || id < 1 || !Number.isSafeInteger(index) || index < 0 || index > 2) {
    return unavailable();
  }

  const supabase = createAdminClient();
  const { data: row, error } = await supabase
    .from("bakery")
    .select("data")
    .eq("type", "custom_cake")
    .eq("id", id)
    .maybeSingle();
  if (error || !row) return unavailable();

  const parsed = customCakeDataSchema.safeParse(row.data);
  const imageKey = parsed.success ? parsed.data.reference_images[index] : undefined;
  if (typeof imageKey !== "string") return unavailable();

  if (!PRIVATE_KEY.test(imageKey)) {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
    const legacyPrefix = baseUrl
      ? `${baseUrl}/storage/v1/object/public/bakery/custom-cake/`
      : "";
    if (legacyPrefix && imageKey.startsWith(legacyPrefix)) {
      return NextResponse.redirect(imageKey, {
        status: 302,
        headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" },
      });
    }
    return unavailable();
  }

  const { data: file, error: storageError } = await supabase.storage.from(PRIVATE_BUCKET).download(imageKey);
  if (storageError || !file || !["image/webp", "image/png", "image/jpeg", "image/avif"].includes(file.type)) {
    return unavailable();
  }

  return new NextResponse(file, {
    headers: {
      "Content-Type": file.type,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}
