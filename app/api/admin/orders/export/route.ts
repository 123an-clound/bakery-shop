import { NextResponse } from "next/server";

import { listAdminOrders, ordersToCsv } from "@/lib/bakery/admin/orders";
import { requireAdmin } from "@/lib/auth/require-admin";

/** proxy.ts already gates every /api/admin/* path — requireAdmin() here is
 * the mục 6.1 lớp 3 defense-in-depth check (route handler re-verifies). */
export async function GET(request: Request) {
  await requireAdmin();
  const url = new URL(request.url);
  const orders = await listAdminOrders({
    status: url.searchParams.get("status") ?? undefined,
    paymentMethod: url.searchParams.get("paymentMethod") ?? undefined,
    search: url.searchParams.get("search") ?? undefined,
  });
  const csv = ordersToCsv(orders);

  return new NextResponse(await csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="don-hang-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
