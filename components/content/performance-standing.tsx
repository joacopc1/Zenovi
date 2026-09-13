import type { RankedContentItem } from "@/lib/content/library";

const multiplierFormatter = new Intl.NumberFormat("es-UY", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Fuera de esta banda la diferencia deja de ser ruido y pasa a ser señal. */
const SIGNAL_BAND = { low: 0.8, high: 1.2 } as const;

/**
 * El veredicto de la pieza, para el encabezado de su vista de detalle.
 * No es una tarjeta: es la respuesta de la pantalla, así que se lee junto al
 * título y no como un módulo más entre otros.
 */
export function PerformanceStanding({
  item,
  rank,
  formatPlural,
}: {
  item: RankedContentItem;
  rank: { position: number; total: number } | null;
  formatPlural: string;
}) {
  const { multiplier } = item;

  if (multiplier === null) {
    return (
      <p className="mt-2 max-w-2xl text-[13px] leading-6 text-muted">
        Todavía no hay suficientes {formatPlural} sincronizados con métricas para decir si
        esta pieza rindió por encima o por debajo de lo habitual.
      </p>
    );
  }

  return (
    <p className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[13px] leading-6 text-graphite">
      <strong className={`text-lg font-semibold tabular-nums ${toneClass(multiplier)}`}>
        ×{multiplierFormatter.format(multiplier)}
      </strong>
      <span>
        {verdict(multiplier)} la mediana de tus {formatPlural}.
        {rank ? ` Es la número ${rank.position} de ${rank.total} por visualizaciones.` : ""}
      </span>
    </p>
  );
}

function verdict(multiplier: number) {
  if (multiplier >= SIGNAL_BAND.high) return "Rindió por encima de";
  if (multiplier <= SIGNAL_BAND.low) return "Rindió por debajo de";
  return "Rindió en línea con";
}

function toneClass(multiplier: number) {
  if (multiplier >= SIGNAL_BAND.high) return "text-success";
  if (multiplier <= SIGNAL_BAND.low) return "text-danger";
  return "text-ink";
}
