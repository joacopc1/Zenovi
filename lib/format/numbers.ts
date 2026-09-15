const fullNumber = new Intl.NumberFormat("es-UY", { maximumFractionDigits: 0 });
const oneDecimal = new Intl.NumberFormat("es-UY", { maximumFractionDigits: 1 });
const percentFormatter = new Intl.NumberFormat("es-UY", {
  style: "percent",
  maximumFractionDigits: 1,
});

/**
 * Cifras en K y M, como las muestra Instagram y como las lee una marca personal.
 * Debajo de 10.000 se muestra entera: "9.412" dice más que "9,4K".
 */
export function formatCompact(value: number | null) {
  if (value === null) return "—";
  if (Math.abs(value) >= 1_000_000) return `${oneDecimal.format(value / 1_000_000)}M`;
  if (Math.abs(value) >= 10_000) return `${oneDecimal.format(value / 1_000)}K`;
  return fullNumber.format(value);
}

export function formatNumber(value: number | null) {
  return value === null ? "—" : fullNumber.format(value);
}

export function formatPercent(value: number | null) {
  return value === null ? "—" : percentFormatter.format(value);
}

export function formatDecimal(value: number | null) {
  return value === null ? "—" : oneDecimal.format(value);
}
