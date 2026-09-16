import { Link2, Radar, UserSearch } from "lucide-react";
import ProgressMetricCard from "@/components/ui/progress-metric-card";
import { FunnelChartCard } from "@/components/ui/funnel-chart-card";
import { ratio } from "@/lib/analytics/account-insights";
import type { ReportModel } from "@/lib/analytics/report-model";
import { formatPercent } from "@/lib/format/numbers";
import { DailyChart } from "../daily-chart";
import { ProportionBar } from "../proportion-blocks";
import { ReportCard } from "../report-blocks";
import {
  audienceSlices,
  contentSlices,
  metricCard,
  pendingSync,
  toPoints,
  trendOf,
} from "../report-view";

export function VisibilitySection({ model }: { model: ReportModel }) {
  const audience = model.viewsByAudience;
  const audiencia = audienceSlices(audience);
  const contenido = contentSlices(model.viewsByContent);

  return (
    <>
      {/* La card de embudo ocupa el ancho entero: visualizaciones arriba y, debajo, los
          pasos siguientes del mismo recorrido hasta el enlace de la bio. */}
      <FunnelChartCard
        title="Visualizaciones"
        value={model.views.current}
        trend={trendOf(model.views)}
        period={`Últimos ${model.days} días`}
        chart={
          <DailyChart
            label="Visualizaciones por día"
            mode="line"
            series={[{ key: "views", label: "Visualizaciones", color: "var(--color-series-1)" }]}
            points={toPoints(model.window, ["views"])}
          />
        }
        rows={[
          {
            key: "reach",
            label: "Alcance",
            hint: "Cuentas distintas que vieron tu contenido. Una persona que vio tres Reels suma tres visualizaciones, pero una sola cuenta alcanzada.",
            icon: <Radar size={15} strokeWidth={1.75} />,
            value: model.reach,
            trend: null,
          },
          {
            key: "profileViews",
            label: "Visitas al perfil",
            icon: <UserSearch size={15} strokeWidth={1.75} />,
            value: model.profileViews.current,
            trend: trendOf(model.profileViews),
          },
          {
            key: "linkTaps",
            label: "Toques en el enlace",
            icon: <Link2 size={15} strokeWidth={1.75} />,
            value: model.linkTaps.current,
            trend: trendOf(model.linkTaps),
          },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ReportCard
          title="Seguidores y no seguidores"
          hint="De dónde vinieron tus visualizaciones. Cuanto más alto el lado de no seguidores, más gente nueva te está descubriendo."
        >
          {audiencia && audience ? (
            <>
              <ProportionBar slices={audiencia} />
              <p className="font-support mt-5 border-t border-mist pt-4 text-[13px] leading-6 text-graphite">
                {formatPercent(ratio(audience.nonFollowers, audience.followers + audience.nonFollowers))} de tus
                visualizaciones vino de cuentas que todavía no te siguen.
              </p>
            </>
          ) : (
            <p className="font-support text-xs leading-5 text-muted">{pendingSync}.</p>
          )}
        </ReportCard>

        <ReportCard title="Visualizaciones por tipo de contenido">
          {contenido ? (
            <ProportionBar slices={contenido} />
          ) : (
            <p className="font-support text-xs leading-5 text-muted">{pendingSync}.</p>
          )}
        </ReportCard>
      </div>

      {/* Cada paso del embudo, con su propia evolución día a día. */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ProgressMetricCard
          size="sm"
          unit="cuentas"
          {...metricCard(model, "Alcance", (point) => point.reach, null, model.reach)}
        />
        <ProgressMetricCard
          size="sm"
          unit="visitas"
          {...metricCard(model, "Visitas al perfil", (point) => point.profileViews, model.profileViews)}
        />
        <ProgressMetricCard
          size="sm"
          unit="toques"
          {...metricCard(model, "Toques en el enlace", (point) => point.linkTaps, model.linkTaps)}
        />
      </div>
    </>
  );
}
