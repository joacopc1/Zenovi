import { BarStatCard } from "@/components/ui/bar-stat-card";
import type { ReportModel } from "@/lib/analytics/report-model";
import { formatNumber } from "@/lib/format/numbers";
import { ReportCard } from "../report-blocks";
import { contentIcon } from "../report-view";
import { TopContent } from "../top-content";

export function ContentSection({ model }: { model: ReportModel }) {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <TopContent items={model.topPieces} />
        <BarStatCard
          title="Contenido publicado"
          value={model.published}
          description="Reels y publicaciones; no incluye historias"
          bars={model.publishedBars}
        />
      </div>

      <ReportCard
        title="Rendimiento por formato"
        hint="La mediana, no el promedio: una pieza que explotó levantaría el promedio y haría parecer que el formato rinde siempre así. Hacen falta tres piezas del formato para afirmar una mediana."
      >
        {model.formats.length === 0 ? (
          <p className="font-support text-xs leading-5 text-muted">
            Todavía no publicaste nada en el período.
          </p>
        ) : (
          <dl className="grid gap-3 sm:grid-cols-3">
            {model.formats.map((format) => (
              <div key={format.kind} className="rounded-control border border-mist bg-canvas px-4 py-3">
                <dt className="font-support flex items-center gap-1.5 text-xs text-graphite">
                  <span aria-hidden="true" className="flex text-graphite">
                    {contentIcon(format.kind)}
                  </span>
                  {format.label}
                  <span className="text-muted">
                    · {format.count} {format.count === 1 ? "pieza" : "piezas"}
                  </span>
                </dt>
                <dd className="font-numeric mt-1.5 text-[22px] font-bold leading-none tracking-[-0.02em]">
                  {format.median === null ? "—" : formatNumber(Math.round(format.median))}
                </dd>
                <p className="font-support mt-1.5 text-xs text-muted">
                  {format.median === null
                    ? "Hacen falta tres piezas para medirlo"
                    : `Visualizaciones habituales · mejor: ${formatNumber(format.best?.views ?? null)}`}
                </p>
              </div>
            ))}
          </dl>
        )}
      </ReportCard>
    </>
  );
}
