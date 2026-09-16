import { Heart } from "lucide-react";
import { SaveIcon } from "@/components/content/metric-icons";
import ProgressMetricCard from "@/components/ui/progress-metric-card";
import type { ReportModel } from "@/lib/analytics/report-model";
import type { InstagramDailyMetric } from "@/lib/data/daily-metric-series";
import { DailyChart } from "../daily-chart";
import { ProportionBar } from "../proportion-blocks";
import { RateTile, ReportCard } from "../report-blocks";
import {
  engagementSeries,
  engagementSlices,
  metricCard,
  toPoints,
} from "../report-view";

export function EngagementSection({ model }: { model: ReportModel }) {
  const composition = engagementSlices(model.composition);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <RateTile
          label="Tasa de engagement"
          icon={<Heart size={14} strokeWidth={1.75} />}
          hint="Qué porción de las visualizaciones terminó en alguna interacción. Es la medida de si tu contenido mueve a la gente, no sólo si la alcanza."
          value={model.engagementRate}
          previous={model.previousEngagementRate}
          numerator={model.interactions.current}
          denominator={model.views.current}
          unit="interacciones"
          over="visualizaciones"
          color="var(--color-series-1)"
        />
        <RateTile
          label="Tasa de guardados"
          icon={<SaveIcon className="size-3.5" />}
          hint="Qué porción de las visualizaciones terminó en un guardado. Es la señal más fuerte de contenido útil: alguien quiere volver a verlo."
          value={model.saveRate}
          previous={model.previousSaveRate}
          numerator={model.saves.current}
          denominator={model.views.current}
          unit="guardados"
          over="visualizaciones"
          color="var(--color-series-3)"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ProgressMetricCard
          size="sm"
          unit="interacciones"
          {...metricCard(model, "Interacciones", (point) => point.interactions, model.interactions)}
        />

        <ReportCard title="Interacciones por tipo">
          <DailyChart
            label="Interacciones por día según tipo"
            mode="stacked"
            series={engagementSeries}
            points={toPoints(
              model.window,
              engagementSeries.map((item) => item.key as keyof InstagramDailyMetric),
            )}
          />
        </ReportCard>

        <ReportCard title="Composición">
          {composition ? (
            <ProportionBar slices={composition} />
          ) : (
            <p className="font-support text-xs leading-5 text-muted">
              Todavía no hay interacciones informadas en el período.
            </p>
          )}
          <p className="font-support mt-5 border-t border-mist pt-4 text-[13px] leading-6 text-graphite">
            {model.reading ??
              "Todavía no hay suficientes interacciones para leer un patrón. La lectura aparece desde 20 interacciones en el período."}
          </p>
        </ReportCard>
      </div>
    </>
  );
}
