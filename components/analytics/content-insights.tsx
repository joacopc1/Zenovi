import type { InstagramContentSummary } from "@/lib/data/instagram-dashboard";

const numberFormatter = new Intl.NumberFormat("es-UY");
const decimalFormatter = new Intl.NumberFormat("es-UY", { maximumFractionDigits: 1 });

export function ContentInsights({ content }: { content: InstagramContentSummary[] }) {
  const totals = [
    { label: "Me gusta", value: sumAvailable(content.map((item) => item.likes)) },
    { label: "Comentarios", value: sumAvailable(content.map((item) => item.comments)) },
    { label: "Guardados", value: sumAvailable(content.map((item) => item.saves)) },
    { label: "Compartidos", value: sumAvailable(content.map((item) => item.shares)) },
  ];

  return (
    <section className="overflow-hidden rounded-card border border-mist bg-paper">
      <header className="border-b border-mist px-5 py-4">
        <h2 className="text-base font-semibold">Rendimiento del contenido</h2>
        <p className="mt-1 text-xs text-muted">
          Acumulado de las {content.length} piezas mostradas · fuente: Instagram
        </p>
      </header>

      <dl className="grid border-b border-mist sm:grid-cols-2 lg:grid-cols-4">
        {totals.map((metric) => (
          <div key={metric.label} className="border-mist px-5 py-4 sm:border-r last:border-r-0">
            <dt className="text-xs text-muted">{metric.label}</dt>
            <dd className="mt-1.5 text-xl font-semibold tabular-nums">{formatMetric(metric.value)}</dd>
          </div>
        ))}
      </dl>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] border-collapse text-left">
          <thead>
            <tr className="text-xs font-medium text-muted">
              <th className="px-5 py-3 font-medium">Pieza</th>
              <th className="px-3 py-3 font-medium">Alcance</th>
              <th className="px-3 py-3 font-medium">Visualizaciones</th>
              <th className="px-3 py-3 font-medium">Interacciones</th>
              <th className="px-3 py-3 font-medium">Guardados</th>
              <th className="px-3 py-3 font-medium">Compartidos</th>
              <th className="px-3 py-3 font-medium">Tiempo medio</th>
              <th className="px-3 py-3 font-medium">Tiempo total</th>
              <th className="px-5 py-3 font-medium">Omisión inicial</th>
            </tr>
          </thead>
          <tbody>
            {content.map((item) => (
              <tr key={item.id} className="border-t border-mist text-sm">
                <td className="px-5 py-3.5">
                  <strong className="block font-medium">{item.contentLabel}</strong>
                  <span className="mt-0.5 block text-xs text-muted">{item.dateLabel}</span>
                </td>
                <MetricCell value={item.reach} />
                <MetricCell value={item.views} />
                <MetricCell value={item.interactions} />
                <MetricCell value={item.saves} />
                <MetricCell value={item.shares} />
                <td className="px-3 py-3.5 tabular-nums">{formatMilliseconds(item.averageWatchTimeMs)}</td>
                <td className="px-3 py-3.5 tabular-nums">{formatWatchTotal(item.totalWatchTimeMs)}</td>
                <td className="px-5 py-3.5 tabular-nums">{formatRate(item.skipRate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MetricCell({ value }: { value: number | null }) {
  return <td className="px-3 py-3.5 tabular-nums">{formatMetric(value)}</td>;
}

function sumAvailable(values: (number | null)[]) {
  const available = values.filter((value): value is number => value !== null);
  return available.length === 0 ? null : available.reduce((total, value) => total + value, 0);
}

function formatMetric(value: number | null) {
  return value === null ? "—" : numberFormatter.format(Math.round(value));
}

function formatMilliseconds(value: number | null) {
  if (value === null) return "—";
  return `${decimalFormatter.format(value / 1000)} s`;
}

function formatWatchTotal(value: number | null) {
  if (value === null) return "—";
  const seconds = value / 1000;
  return seconds >= 60
    ? `${decimalFormatter.format(seconds / 60)} min`
    : `${decimalFormatter.format(seconds)} s`;
}

function formatRate(value: number | null) {
  if (value === null) return "—";
  const percentage = value <= 1 ? value * 100 : value;
  return `${decimalFormatter.format(percentage)} %`;
}
