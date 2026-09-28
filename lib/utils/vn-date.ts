const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Admin date inputs store "YYYY-MM-DD". `new Date("YYYY-MM-DD")` is UTC
 * midnight (07:00 in Vietnam), so a coupon/banner "ending 30/09" would stop
 * at 07:00 that morning. Pin date-only values to the shop's day (+07:00);
 * full ISO timestamps pass through unchanged.
 */
export function vnDayStart(value: string): number {
  return new Date(DATE_ONLY.test(value) ? `${value}T00:00:00+07:00` : value).getTime();
}

export function vnDayEnd(value: string): number {
  return new Date(DATE_ONLY.test(value) ? `${value}T23:59:59.999+07:00` : value).getTime();
}
