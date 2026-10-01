/** One canonical origin for metadata, JSON-LD, robots and sitemap. */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) {
    const previewHost = process.env.VERCEL_URL?.trim();
    if (process.env.VERCEL_ENV === "preview" && previewHost) {
      try {
        const previewUrl = new URL(`https://${previewHost}`);
        if (
          previewUrl.host !== previewHost ||
          previewUrl.pathname !== "/" ||
          previewUrl.search ||
          previewUrl.hash
        ) {
          throw new Error("invalid preview hostname");
        }
        return previewUrl.origin;
      } catch {
        throw new Error("VERCEL_URL must be a valid preview hostname");
      }
    }
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        process.env.VERCEL_ENV === "preview"
          ? "VERCEL_URL or NEXT_PUBLIC_SITE_URL must be configured for previews"
          : "NEXT_PUBLIC_SITE_URL must be configured in production",
      );
    }
    return "http://localhost:3000";
  }
  try {
    const url = new URL(configured);
    if (url.protocol !== "https:" && process.env.NODE_ENV === "production") {
      throw new Error("NEXT_PUBLIC_SITE_URL must use HTTPS in production");
    }
    return url.origin;
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL must be a valid absolute URL");
  }
}
