/** Pakistani Rupees stored as paisa (1 PKR = 100 paisa) in the database. */

export function rupeesToMinor(rupees: number): number {
  return Math.round(rupees * 100);
}

export function minorToRupees(minor: number): number {
  return minor / 100;
}

export function formatPKR(minor: number): string {
  const rupees = minorToRupees(minor);
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rupees);
}

export function parseRupeesInput(value: string): number | null {
  const trimmed = value.trim().replace(/,/g, "");
  if (!trimmed) return null;
  const num = Number(trimmed);
  if (!Number.isFinite(num) || num <= 0) return null;
  return rupeesToMinor(num);
}
