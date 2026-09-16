const fullNumber = new Intl.NumberFormat("es-UY", { maximumFractionDigits: 0 });
const oneDecimal = new Intl.NumberFormat("es-UY", { maximumFractionDigits: 1 });
const percentFormatter = new Intl.NumberFormat("es-UY", {
  style: "percent",
  maximumFractionDigits: 1,
});

/**
 * Cifras en k y M, como las muestra Instagram y como las lee una marca personal.
 * Debajo de mil van enteras: una cuenta que arranca necesita ver "10", no "0,0k".
 */
export function formatCompact(value: number | null) {
  if (value === null) return "—";
  if (Math.abs(value) >= 1_000_000) return `${oneDecimal.format(value / 1_000_000)}M`;
  if (Math.abs(value) >= 1_000) return `${oneDecimal.format(value / 1_000)}k`;
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

/** Una variación siempre lleva su signo: "+12", "−3". El menos es el real, no un guion. */
export function formatSigned(value: number | null) {
  if (value === null) return "—";
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${fullNumber.format(Math.abs(value))}`;
}
