import { productDataSchema, type OrderData } from "./schemas";
import type { OrderInput } from "@/lib/schemas/order-input";

export class CheckoutError extends Error {
  constructor(public code: string) { super(code); }
}

/** Snapshot products only after validating all selected variants and combined quantities. */
export function priceOrderItems(input: OrderInput, rows: Array<{ id: number; data: unknown }>, now = Date.now()): OrderData["items_snapshot"] {
  const products = new Map(rows.map(row => [row.id, productDataSchema.parse(row.data)]));
  const quantities = new Map<number, number>();
  for (const line of input.items) quantities.set(line.productId, (quantities.get(line.productId) ?? 0) + line.qty);
  return input.items.map(line => {
    const product = products.get(line.productId);
    if (!product) throw new CheckoutError("product_not_found");
    if (product.stock != null && product.stock < quantities.get(line.productId)!) throw new CheckoutError("out_of_stock");
    if (new Date(input.deliveryAt).getTime() < now + product.prep_time_hours * 3_600_000) throw new CheckoutError("delivery_too_soon");
    if (Object.keys(line.options).length !== product.options.length) throw new CheckoutError("invalid_option");
    let delta = 0;
    for (const option of product.options) {
      const choice = option.choices.find(value => value.value === line.options[option.key]);
      if (!choice) throw new CheckoutError("invalid_option");
      delta += choice.price_delta;
    }
    const unitPrice = (product.sale_price != null && product.sale_price < product.price ? product.sale_price : product.price) + delta;
    if (!Number.isSafeInteger(unitPrice) || unitPrice < 0 || !Number.isSafeInteger(unitPrice * line.qty)) throw new CheckoutError("invalid_price");
    return { product_id: line.productId, name: product.name.vi, image: product.images[0], unit_price: unitPrice, qty: line.qty, options: line.options, line_total: unitPrice * line.qty };
  });
}
