// A <input type="datetime-local"> value/min is interpreted in the BROWSER's
// local time, with no timezone marker — toISOString() returns UTC, which on
// any machine not at UTC+0 silently shifts the represented instant by the
// local offset (e.g. -7h in Vietnam). Build the string from local getters
// instead so it means what it says.
export function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Stored ISO timestamp → value for a datetime-local input ("" when absent/invalid). */
export function isoToDatetimeLocalValue(iso: string | undefined | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : toDatetimeLocalValue(d);
}
