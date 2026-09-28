/** One canonical origin for metadata, JSON-LD, robots and sitemap. */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("NEXT_PUBLIC_SITE_URL must be configured in production");
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
