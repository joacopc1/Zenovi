import { calculateTrend, getTrendColorClass } from "@/components/home/trend";
import type { InstagramAccountMetricSummary } from "@/lib/data/instagram-dashboard";

const definitions = [
  { metric: "profile_views", label: "Visitas al perfil" },
  { metric: "accounts_engaged", label: "Cuentas con interacción" },
  { metric: "profile_links_taps", label: "Toques en el enlace" },
] as const;

const numberFormatter = new Intl.NumberFormat("es-UY");

export function AccountActivity({ summaries }: { summaries: InstagramAccountMetricSummary[] }) {
  const summaryByMetric = new Map(summaries.map((summary) => [summary.metric, summary]));

  return (
    <section className="overflow-hidden rounded-card border border-mist bg-paper">
      <header className="border-b border-mist px-5 py-4">
        <h2 className="text-base font-semibold">Actividad de la cuenta</h2>
        <p className="mt-1 text-xs text-muted">
          Últimos 7 días comparados con los 7 anteriores · fuente: Instagram
        </p>
      </header>
      <dl className="grid md:grid-cols-3">
        {definitions.map((definition) => {
          const summary = summaryByMetric.get(definition.metric);
          const available = summary !== undefined;
          const current = summary?.current ?? 0;
          const previous = summary?.previous ?? 0;
          const trend = calculateTrend(current, previous, available && summary?.previous !== null);
          const comparison = formatComparison(
            current,
            previous,
            available,
            summary?.previous ?? null,
            trend,
          );

          return (
            <div
              key={definition.metric}
              className="border-b border-mist px-5 py-4 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
            >
              <dt className="text-sm font-medium text-graphite">{definition.label}</dt>
              <dd className="mt-2 text-2xl font-semibold tracking-[-0.025em] tabular-nums">
                {available ? numberFormatter.format(Math.round(current)) : "—"}
              </dd>
              <p className={`mt-1 text-xs ${getTrendColorClass(trend.direction)}`}>
                {comparison}
              </p>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

function formatComparison(
  current: number,
  previous: number,
  available: boolean,
  previousValue: number | null,
  trend: ReturnType<typeof calculateTrend>,
) {
  if (!available) return "Instagram no devolvió este dato";
  if (previousValue === null) return "Sin período anterior disponible";
  if (previous === 0) return current === 0 ? "Sin actividad" : "Sin base comparable";

  if (trend.direction === "flat") return "Sin cambios";

  return `${trend.direction === "up" ? "↗" : "↘"} ${numberFormatter.format(Math.abs(Math.round(trend.percentage ?? 0)))}%`;
}
