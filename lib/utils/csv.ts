/** Quote a CSV field and prefix formula-like values so spreadsheet apps treat them as text. */
export function escapeCsvCell(value: string): string {
  const safeValue = /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replace(/"/g, '""')}"`;
}
