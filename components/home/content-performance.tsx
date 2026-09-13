import type { InstagramContentSummary } from "@/lib/data/instagram-dashboard";

const numberFormatter = new Intl.NumberFormat("es-UY");

export function ContentPerformance({ content }: { content: InstagramContentSummary[] }) {
  const useViews = content.every((item) => item.reach === null);
  const performanceValues = content.map((item) => (useViews ? item.views : item.reach) ?? 0);
  const maximumPerformance = Math.max(...performanceValues, 1);

  return (
    <section className="overflow-hidden rounded-card border border-mist bg-paper">
      <div className="flex items-center justify-between border-b border-mist px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">Contenido destacado</h2>
          <p className="mt-0.5 text-xs text-muted">
            Ordenado por {useViews ? "visualizaciones" : "alcance"}
          </p>
        </div>
        <span className="text-xs text-muted">Top {content.length}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-left">
          <thead>
            <tr className="text-xs font-medium text-muted">
              <th className="px-5 py-3 font-medium">Pieza</th>
              <th className="px-4 py-3 font-medium">Alcance</th>
              <th className="px-4 py-3 font-medium">Visualizaciones</th>
              <th className="px-4 py-3 font-medium">Interacciones</th>
              <th className="w-40 px-5 py-3 font-medium">Rendimiento</th>
            </tr>
          </thead>
          <tbody>
            {content.map((item, index) => (
              <tr key={item.id} className="border-t border-mist text-sm">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="size-2 rounded-full bg-mist-strong" />
                    <span>
                      <strong className="block font-medium">{item.contentLabel}</strong>
                      <span className="mt-0.5 block text-xs text-muted">{item.dateLabel}</span>
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5 tabular-nums">{formatMetric(item.reach)}</td>
                <td className="px-4 py-3.5 tabular-nums">{formatMetric(item.views)}</td>
                <td className="px-4 py-3.5 tabular-nums">{formatMetric(item.interactions)}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-control">
                      <span
                        className="block h-full rounded-full bg-ink"
                        style={{
                          width: `${(performanceValues[index] / maximumPerformance) * 100}%`,
                        }}
                      />
                    </span>
                    {item.permalink ? (
                      <a
                        href={item.permalink}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-graphite hover:text-ink"
                        aria-label={`Abrir ${item.contentLabel} del ${item.dateLabel} en Instagram`}
                      >
                        Abrir ↗
                      </a>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatNumber(value: number) {
  return numberFormatter.format(Math.round(value));
}

function formatMetric(value: number | null) {
  return value === null ? "—" : formatNumber(value);
}
