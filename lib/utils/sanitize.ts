import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitizes admin-authored HTML (product/post/page `content`) before
 * `dangerouslySetInnerHTML` — muc 6.3 checklist item.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html);
}

/** Strips tags for short plain-text previews (story teaser, meta description). */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Sanitizes `setting.map_embed` (a Google Maps `<iframe>` snippet, admin-only
 * input from /admin/cai-dat). DOMPurify's default config strips <iframe>
 * entirely, so this uses an explicit allowlist: no `on*` event handlers, no
 * `javascript:`/`data:` src — still defense-in-depth even though only the
 * admin can set this value (muc 6.3 checklist applies to all admin HTML).
 */
export function sanitizeMapEmbed(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["iframe"],
    ALLOWED_ATTR: ["src", "width", "height", "style", "allowfullscreen", "loading", "referrerpolicy"],
    ALLOWED_URI_REGEXP: /^https:\/\//,
  });
}
