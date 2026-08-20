import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminAuthenticated } from "@/lib/auth/require-admin";
import { validateImageUpload } from "@/lib/utils/file-validation";

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
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }

  const folderInput = formData?.get("folder");
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
    console.error("[upload] loi upload storage:", error);
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: publicUrlData.publicUrl }, { status: 201 });
}
