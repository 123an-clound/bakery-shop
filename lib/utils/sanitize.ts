import sanitizeHtmlLib from "sanitize-html";

// isomorphic-dompurify (via jsdom) previously backed this file, but jsdom's
// own dependency tree keeps pulling in ESM-only packages (@exodus/bytes,
// @csstools/css-calc...) that crash with ERR_REQUIRE_ESM the moment
// anything imports it in Vercel's serverless runtime — sanitize-html is a
// pure-JS parser with no DOM emulation, so it doesn't have this problem.

// Admin authors raw HTML directly into a <textarea> (no rich-text editor —
// see components/admin/posts/post-form.tsx), so the allowlist needs to
// cover normal blog/product-description markup, not just sanitize-html's
// conservative defaults.
const CONTENT_TAGS = sanitizeHtmlLib.defaults.allowedTags.concat(["img", "h1", "h2"]);
const CONTENT_ATTRIBUTES = {
  ...sanitizeHtmlLib.defaults.allowedAttributes,
  "*": ["class"],
  a: ["href", "name", "target", "rel"],
  img: ["src", "alt", "width", "height"],
};

/**
 * Sanitizes admin-authored HTML (product/post/page `content`) before
 * `dangerouslySetInnerHTML` — muc 6.3 checklist item.
 */
export function sanitizeHtml(html: string): string {
  return sanitizeHtmlLib(html, { allowedTags: CONTENT_TAGS, allowedAttributes: CONTENT_ATTRIBUTES });
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
 * input from /admin/cai-dat). The default allowlist above strips <iframe>
 * entirely, so this uses its own explicit allowlist: no `on*` event
 * handlers, https-only src — still defense-in-depth even though only the
 * admin can set this value (muc 6.3 checklist applies to all admin HTML).
 */
export function sanitizeMapEmbed(html: string): string {
  return sanitizeHtmlLib(html, {
    allowedTags: ["iframe"],
    allowedAttributes: { iframe: ["src", "width", "height", "style", "allowfullscreen", "loading", "referrerpolicy"] },
    allowedSchemesByTag: { iframe: ["https"] },
  });
}
