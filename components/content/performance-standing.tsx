import type { RankedContentItem } from "@/lib/content/library";
import { getPerformanceVerdict } from "@/lib/content/metrics";
import { PerformanceBadge } from "./performance-badge";

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

  if (multiplier === null) return null;

  return (
    <div className="font-support mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[13px] leading-5 text-graphite">
      <PerformanceBadge multiplier={multiplier} />
      <span>
        {getPerformanceVerdict(multiplier)} la mediana de tus {formatPlural}.
        {rank ? ` Es la número ${rank.position} de ${rank.total} por visualizaciones.` : ""}
      </span>
    </div>
  );
}
