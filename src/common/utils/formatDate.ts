// Formats a Date (or date-like value) as a human-readable "DD/MM/YYYY" string.
// Returns null for missing/invalid dates so resources can stay nullable-safe.
export function formatDateDMY(value?: Date | string | number | null): string | null {
  if (value === undefined || value === null) return null;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}
