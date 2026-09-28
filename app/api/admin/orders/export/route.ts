import { NextResponse } from "next/server";

import { listAdminOrders, ordersToCsv } from "@/lib/bakery/admin/orders";
import { requireAdmin } from "@/lib/auth/require-admin";
import { vnDayEnd, vnDayStart } from "@/lib/utils/vn-date";

/** "YYYY-MM-DD" → ISO bound in Vietnam time; anything else is ignored. */
function vnDayBound(day: string | null, toMs: (day: string) => number): string | undefined {
  if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return undefined;
  const ms = toMs(day);
  return Number.isNaN(ms) ? undefined : new Date(ms).toISOString();
}

/** proxy.ts already gates every /api/admin/* path — requireAdmin() here is
 * the mục 6.1 lớp 3 defense-in-depth check (route handler re-verifies). */
export async function GET(request: Request) {
  await requireAdmin();
  const url = new URL(request.url);
  const orders = await listAdminOrders({
    status: url.searchParams.get("status") ?? undefined,
    paymentMethod: url.searchParams.get("paymentMethod") ?? undefined,
    search: url.searchParams.get("search") ?? undefined,
    dateFrom: vnDayBound(url.searchParams.get("dateFrom"), vnDayStart),
    dateTo: vnDayBound(url.searchParams.get("dateTo"), vnDayEnd),
  });
  const csv = ordersToCsv(orders);

  return new NextResponse(await csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="don-hang-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
