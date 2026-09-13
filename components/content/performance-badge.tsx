const multiplierFormatter = new Intl.NumberFormat("es-UY", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Fuera de esta banda la diferencia deja de ser ruido y pasa a ser señal. */
const SIGNAL_BAND = { low: 0.8, high: 1.2 } as const;

/**
 * Cuántas veces rindió una pieza respecto de la mediana de su formato.
 * No se renderiza cuando no hay base comparable: es preferible no decir nada
 * a insinuar una precisión que no tenemos.
 */
export function PerformanceBadge({
  multiplier,
  className = "",
}: {
  multiplier: number | null;
  className?: string;
}) {
  if (multiplier === null) return null;

  return (
    <span
      title={`Rindió ${multiplierFormatter.format(multiplier)} veces la mediana de este formato`}
      className={`pointer-events-none z-10 rounded-full border border-white/50 bg-white/65 px-2 py-0.5 text-[11px] font-semibold tabular-nums backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_1px_3px_rgba(0,0,0,0.14)] ${toneClass(multiplier)} ${className}`}
    >
      ×{multiplierFormatter.format(multiplier)}
    </span>
  );
}

function toneClass(multiplier: number) {
  if (multiplier >= SIGNAL_BAND.high) return "text-success";
  if (multiplier <= SIGNAL_BAND.low) return "text-danger";
  return "text-ink";
}
