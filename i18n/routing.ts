import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["vi", "en"],
  defaultLocale: "vi",
  // vi has no prefix ("/san-pham"), en is prefixed ("/en/san-pham") — muc 10 KE-HOACH-DU-AN.md.
  localePrefix: "as-needed",
});
