import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminAuthenticated } from "@/lib/auth/require-admin";
import { validateImageUpload } from "@/lib/utils/file-validation";
import { consumeRateLimit, requestClientKey } from "@/lib/security/rate-limit";
import { readLimitedBody } from "@/lib/security/request-body";

const PUBLIC_BUCKET = "bakery";
const PRIVATE_CUSTOM_CAKE_BUCKET = "custom-cake-private";

/** Public catalog media remains public; customer reference photos use a private bucket. */
const PRIVATE_FOLDERS = new Set(["custom-cake"]);
const ADMIN_FOLDERS = new Set(["products", "categories", "banners", "posts", "theme"]);

/**
 * Images upload through this route with service_role; guest reference photos
 * are stored in the private bucket, while admin catalog assets stay public.
 * Server-generated UUID names prevent user-controlled paths.
 */
export async function POST(request: Request) {
  const rate = await consumeRateLimit(`upload:${requestClientKey(request)}`, 20, 15 * 60 * 1000);
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
  if (typeof folderInput === "string" && !PRIVATE_FOLDERS.has(folderInput) && !ADMIN_FOLDERS.has(folderInput)) {
    return NextResponse.json({ error: "invalid_folder" }, { status: 400 });
  }
  const privateFolder = typeof folderInput !== "string" || PRIVATE_FOLDERS.has(folderInput);
  const adminFolder = typeof folderInput === "string" && ADMIN_FOLDERS.has(folderInput) ? folderInput : null;

  if (adminFolder && !(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await validateImageUpload(file);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const path = privateFolder ? `custom-cake/${randomUUID()}.${result.image.ext}` : `${adminFolder}/${randomUUID()}.${result.image.ext}`;
  const bucket = privateFolder ? PRIVATE_CUSTOM_CAKE_BUCKET : PUBLIC_BUCKET;
  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: result.image.mime,
    upsert: false,
  });
  if (error) {
    console.error("[upload] storage_failed");
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }

  if (privateFolder) return NextResponse.json({ key: path }, { status: 201 });
  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path);
  return NextResponse.json({ url: publicUrlData.publicUrl }, { status: 201 });
}
