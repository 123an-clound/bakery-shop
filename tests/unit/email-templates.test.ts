import { describe, expect, it } from "vitest";

import { customCakeRequestEmail, newOrderNotificationEmail, orderStatusUpdateEmail } from "@/lib/email/templates";

describe("email template escaping", () => {
  it("escapes customer supplied text in order notifications", () => {
    const html = newOrderNotificationEmail({
      code: "BK260926-1234",
      customerName: '<img src=x onerror="alert(1)">',
      phone: "0900000000",
      total: 100000,
      paymentMethod: "cod",
    });

    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(html).not.toContain("<img src=x");
  });

  it("escapes custom cake request fields before sending admin email", () => {
    const html = customCakeRequestEmail({
      customerName: "<script>alert(1)</script>",
      phone: "0900000000",
      size: "<a href='https://example.com'>20cm</a>",
      needAt: "2026-09-27T10:00:00.000Z",
    });

    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("&lt;a href=&#39;https://example.com&#39;&gt;20cm&lt;/a&gt;");
    expect(html).not.toContain("<script>");
  });

  it("escapes text entered by an admin in status notification emails", () => {
    const html = orderStatusUpdateEmail({
      brandName: "Bakery",
      code: "BK260926-1234",
      status: "confirmed",
      note: "<a href='https://example.com'>Click</a>",
    });

    expect(html).toContain("&lt;a href=&#39;https://example.com&#39;&gt;Click&lt;/a&gt;");
    expect(html).not.toContain("<a href=");
  });
});
