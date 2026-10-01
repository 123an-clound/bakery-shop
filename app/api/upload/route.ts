import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminAuthenticated } from "@/lib/auth/require-admin";
import { validateImageUpload } from "@/lib/utils/file-validation";
import { consumeRateLimit, requestClientKey } from "@/lib/security/rate-limit";
import { readLimitedBody } from "@/lib/security/request-body";

const BUCKET = "bakery";

/** `custom-cake` stays public (guests upload reference images, Phase 4). Every other folder is admin-only media. */
const PUBLIC_FOLDERS = new Set(["custom-cake"]);
const ADMIN_FOLDERS = new Set(["products", "categories", "banners", "posts", "theme"]);

/**
 * Anh len qua route nay, dung service role — khong co policy INSERT cho
 * anon/authenticated tren storage.objects (chi SELECT public, xem migration
 * 0001). Ten file luon doi thanh uuid — muc 6.3 checklist.
 */
export async function POST(request: Request) {
  const rate = consumeRateLimit(`upload:${requestClientKey(request)}`, 20, 15 * 60 * 1000);
  if (!rate.allowed) return NextResponse.json({ error: "too_many_requests" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  let formData: FormData | null;
  try {
    const body = await readLimitedBody(request, 5 * 1024 * 1024 + 64 * 1024);
    formData = await new Response(body, { headers: { "Content-Type": request.headers.get("content-type") ?? "" } }).formData();
  } catch { return NextResponse.json({ error: "invalid_upload" }, { status: 413 }); }
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }

  const folderInput = formData?.get("folder");
  if (typeof folderInput === "string" && !PUBLIC_FOLDERS.has(folderInput) && !ADMIN_FOLDERS.has(folderInput)) {
    return NextResponse.json({ error: "invalid_folder" }, { status: 400 });
  }
  const folder = typeof folderInput === "string" && PUBLIC_FOLDERS.has(folderInput) ? folderInput : "custom-cake";
  const adminFolder = typeof folderInput === "string" && ADMIN_FOLDERS.has(folderInput) ? folderInput : null;

  if (adminFolder && !(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await validateImageUpload(file);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const path = `${adminFolder ?? folder}/${randomUUID()}.${result.image.ext}`;
  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: result.image.mime,
    upsert: false,
  });
  if (error) {
    console.error("[upload] storage_failed");
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: publicUrlData.publicUrl }, { status: 201 });
}
