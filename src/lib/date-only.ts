const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function parseDateOnlyParts(value: string): { year: number; month: number; day: number } | null {
  if (!DATE_ONLY_REGEX.test(value)) {
    return null;
  }

  const [yearStr, monthStr, dayStr] = value.split("-");
  const year = Number.parseInt(yearStr, 10);
  const month = Number.parseInt(monthStr, 10);
  const day = Number.parseInt(dayStr, 10);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const utcDate = new Date(Date.UTC(year, month - 1, day));
  if (
    utcDate.getUTCFullYear() !== year ||
    utcDate.getUTCMonth() !== month - 1 ||
    utcDate.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

export function isDateOnly(value: string | null | undefined): value is string {
  return typeof value === "string" && parseDateOnlyParts(value) !== null;
}

export function formatDateOnlyToPtBr(value: string | null | undefined, fallback = "-"): string {
  if (!value) return fallback;

  const parts = parseDateOnlyParts(value);
  if (!parts) return value;

  const day = String(parts.day).padStart(2, "0");
  const month = String(parts.month).padStart(2, "0");
  return `${day}/${month}/${parts.year}`;
}

export function compareDateOnly(left: string, right: string): number {
  return left.localeCompare(right);
}
