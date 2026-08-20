import { NextResponse } from "next/server";

import { listAdminOrders, ordersToCsv } from "@/lib/bakery/admin/orders";

/** Admin-only via proxy.ts (path starts with /api/admin). */
export async function GET(request: Request) {
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
