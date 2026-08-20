const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/**
 * Sniffs the actual file signature instead of trusting `Content-Type` — muc
 * 6.3 checklist ("kiem tra magic bytes chu khong chi tin Content-Type").
 */
function sniffImageMime(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  if (bytes.length >= 12 && bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
    const brand = String.fromCharCode(bytes[8]!, bytes[9]!, bytes[10]!, bytes[11]!);
    if (brand === "avif" || brand === "avis" || brand === "mif1") {
      return "image/avif";
    }
  }
  return null;
}

export interface ValidatedImage {
  mime: string;
  ext: string;
}

export type ImageValidationResult = { ok: true; image: ValidatedImage } | { ok: false; error: string };

export async function validateImageUpload(file: File): Promise<ImageValidationResult> {
  if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "file_too_large" };
  }

  const head = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  const sniffedMime = sniffImageMime(head);
  if (!sniffedMime || !(sniffedMime in ALLOWED_MIME_TO_EXT)) {
    return { ok: false, error: "unsupported_file_type" };
  }

  return { ok: true, image: { mime: sniffedMime, ext: ALLOWED_MIME_TO_EXT[sniffedMime]! } };
}
