import { calculateTrend } from "@/components/home/trend";
import ProgressMetricCard, { type CardTrend } from "@/components/ui/progress-metric-card";
import { RadarChart } from "@/components/ui/radar-chart";
import {
  averageByWeekday,
  averagePerReportedDay,
  countPublished,
  engagementComposition,
  followerChange,
  ratio,
  readEngagement,
  strongestWeekday,
} from "@/lib/analytics/account-insights";
import {
  closedWindow,
  summarizePeriod,
  type AdditiveMetric,
  type PeriodTotal,
} from "@/lib/analytics/period-totals";
import type { InstagramDailyMetric } from "@/lib/data/daily-metric-series";
import type { InstagramDashboardData } from "@/lib/data/instagram-dashboard";
import { ContentInsights } from "./content-insights";
import { DailyChart, type ChartPoint, type ChartSeries } from "./daily-chart";
import { formatCompact, formatDecimal, formatNumber, formatPercent } from "@/lib/format/numbers";
import { ProportionBar } from "./proportion-blocks";
import {
  PendingPanel,
  InlineStats,
  PendingTile,
  ReportCard,
  ReportSection,
  StatTile,
  type TileDelta,
} from "./report-blocks";

const HUNDRED_FOLLOWERS =
  "Meta sólo entrega este dato a cuentas con 100 seguidores o más, y todavía no se sincroniza.";

const engagementSeries: ChartSeries[] = [
  { key: "likes", label: "Me gusta", color: "var(--color-series-1)" },
  { key: "comments", label: "Comentarios", color: "var(--color-series-2)" },
  { key: "saves", label: "Guardados", color: "var(--color-series-3)" },
  { key: "shares", label: "Compartidos", color: "var(--color-series-4)" },
];

/**
 * Analíticas como informe: cada sección responde una pregunta, en el orden en que una
 * marca personal las necesita. Primero cómo le fue, después la calidad de la
 * interacción, la visibilidad, la comunidad y la audiencia; al final, qué funcionó.
 */
export function AnalyticsReport({
  dashboard,
  days,
}: {
  dashboard: InstagramDashboardData;
  days: number;
}) {
  const series = dashboard.dailyMetrics;
  const period = (metric: AdditiveMetric) => summarizePeriod(series, metric, days);

  const views = period("views");
  const interactions = period("interactions");
  const likes = period("likes");
  const comments = period("comments");
  const saves = period("saves");
  const shares = period("shares");
  const profileViews = period("profileViews");
  const linkTaps = period("linkTaps");

  // Todos los gráficos miran los mismos días que las cifras: el período ya cerrado.
  const window = closedWindow(series, "views", days);
  const firstDay = window[0]?.date;
  const lastDay = window.at(-1)?.date;

  const composition = engagementComposition({
    likes: likes.current,
    comments: comments.current,
    saves: saves.current,
    shares: shares.current,
  });
  const reading = readEngagement(composition);
  const weekdays = averageByWeekday(window, "interactions");
  const strongest = strongestWeekday(weekdays);
  const followers = followerChange(series.slice(-days));

  return (
    <>
      <ReportSection title="Resumen" question={`¿Cómo te fue en los últimos ${days} días?`}>
        <div className="grid gap-4 lg:grid-cols-2">
          <ProgressMetricCard size="sm" unit="visualizaciones" {...heroCard("Visualizaciones", views, "views")} />
          <ProgressMetricCard size="sm" unit="interacciones" {...heroCard("Interacciones", interactions, "interactions")} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Tasa de engagement"
            value={formatPercent(ratio(interactions.current, views.current))}
            detail="Interacciones / visualizaciones"
          />
          <StatTile
            label="Tasa de guardados"
            value={formatPercent(ratio(saves.current, views.current))}
            detail={saves.current === null ? pendingSync : "Guardados / visualizaciones"}
          />
          <StatTile
            label="Visitas al perfil"
            value={formatCompact(profileViews.current)}
            delta={deltaFor(profileViews)}
            detail={profileViews.current === null ? pendingSync : undefined}
          />
          <StatTile
            label="Toques en el enlace"
            value={formatCompact(linkTaps.current)}
            delta={deltaFor(linkTaps)}
            detail={linkTaps.current === null ? pendingSync : "Clics al enlace de la bio"}
          />
          <StatTile
            label="Contenido publicado"
            value={firstDay && lastDay ? formatNumber(countPublished(dashboard.publishedDates, firstDay, lastDay)) : "—"}
            detail="Piezas publicadas en el período"
          />
          <StatTile
            label="Alcance promedio por día"
            value={formatCompact(averagePerReportedDay(series.slice(-days), "reach"))}
            detail="Cuentas únicas por día"
          />
          <PendingTile label="Conversión perfil → seguidor" reason={HUNDRED_FOLLOWERS} />
        </div>
      </ReportSection>

      <ReportSection
        title="Calidad del engagement"
        question="¿Qué tipo de interacción genera tu contenido?"
      >
        <ReportCard title="Interacciones por día" description="Me gusta, comentarios, guardados y compartidos">
          <DailyChart
            label="Interacciones por día según tipo"
            mode="stacked"
            series={engagementSeries}
            points={toPoints(window, engagementSeries.map((item) => item.key as keyof InstagramDailyMetric))}
          />
        </ReportCard>

        <div className="grid gap-4 lg:grid-cols-2">
          <ReportCard title="Composición" description="Reparto del total del período">
            {composition ? (
              <ProportionBar
                slices={composition.map((slice) => {
                  const meta = engagementSeries.find((item) => item.key === slice.part)!;
                  return { key: slice.part, label: meta.label, color: meta.color, value: slice.value, share: slice.share };
                })}
              />
            ) : (
              <p className="text-xs leading-5 text-muted">Todavía no hay interacciones informadas en el período.</p>
            )}
          </ReportCard>

          <ReportCard title="Lectura" description="Regla fija sobre la composición, no IA">
            <p className="text-sm leading-6 text-ink">
              {reading ??
                "Todavía no hay suficientes interacciones para leer un patrón. La lectura aparece desde 20 interacciones en el período."}
            </p>
          </ReportCard>
        </div>
      </ReportSection>

      <ReportSection title="Visibilidad" question="¿Te está descubriendo gente nueva?">
        <div className="grid gap-4 lg:grid-cols-3">
          {(
            [
              { key: "views", title: "Visualizaciones", description: "Reproducciones de todo tu contenido" },
              { key: "reach", title: "Alcance", description: "Cuentas únicas que te vieron" },
              { key: "profileViews", title: "Visitas al perfil", description: "Personas que entraron a tu perfil" },
            ] as const
          ).map((chart) => (
            <ReportCard key={chart.key} title={chart.title} description={chart.description}>
              <DailyChart
                label={`${chart.title} por día`}
                mode="line"
                series={[{ key: chart.key, label: chart.title, color: "var(--color-series-1)" }]}
                points={toPoints(window, [chart.key])}
              />
            </ReportCard>
          ))}
        </div>
      </ReportSection>

      <ReportSection title="Comunidad" question="¿Estás creciendo y cuándo interactúan más con vos?">
        {/* La evolución necesita más ancho que el radar, que se lee bien en poco espacio. */}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <ReportCard title="Seguidores" description="Se registra el total cada día desde el 12 de septiembre">
            <InlineStats
              items={[
                { label: "Total", value: formatNumber(dashboard.followers), detail: "Cifra exacta actual" },
                {
                  label: "Cambio en el período",
                  value: followers ? signed(followers.change, formatNumber) : "—",
                  detail: followers
                    ? `En ${followers.days} ${followers.days === 1 ? "día" : "días"}`
                    : "Hacen falta dos días registrados",
                },
                {
                  label: "Promedio por día",
                  value: followers?.perDay != null ? signed(followers.perDay, formatDecimal) : "—",
                  detail: "Neto: nuevos menos bajas",
                },
              ]}
            />
            <div className="mt-4">
              <DailyChart
                label="Seguidores por día"
                mode="line"
                series={[{ key: "followers", label: "Seguidores", color: "var(--color-series-1)" }]}
                points={toPoints(series.slice(-days), ["followers"])}
              />
            </div>
            <p className="mt-3 text-xs leading-5 text-muted">
              Los seguidores nuevos y las bajas por separado aparecen cuando la cuenta llegue a 100
              seguidores: Meta no entrega ese dato antes, y todavía no se sincroniza.
            </p>
          </ReportCard>

          <ReportCard title="Días con más interacción" description="Promedio diario de interacciones en el período">
            {weekdays.every((entry) => entry.average !== null) ? (
              <RadarChart
                config={{ interactions: { label: "Interacciones" } }}
                data={weekdays.map((entry) => ({
                  weekday: entry.weekday,
                  interactions: Math.round((entry.average ?? 0) * 10) / 10,
                }))}
                dataKey="weekday"
                series={[{ dataKey: "interactions", name: "Interacciones promedio" }]}
                colors={["var(--color-series-1)"]}
                containerHeight={260}
              />
            ) : (
              // Un día sin datos dibujado en cero deformaría la figura: mejor no dibujarla.
              <p className="flex h-[260px] items-center justify-center rounded-control bg-canvas px-6 text-center text-xs leading-5 text-muted">
                Todavía no hay datos de todos los días de la semana en el período.
              </p>
            )}
            <p className="mt-4 text-xs leading-5 text-muted">
              {strongest
                ? `Los ${weekdayName(strongest.weekday)} recibís en promedio ${formatDecimal(strongest.average)} interacciones. Mide cuándo interactúan con vos, no qué día conviene publicar.`
                : "Hacen falta al menos dos semanas de datos de cada día para señalar uno."}
            </p>
          </ReportCard>
        </div>
      </ReportSection>

      <ReportSection title="Audiencia" question="¿A quién le hablás?">
        <PendingPanel
          title="Demografía"
          items={["Género", "Edad", "País", "Ciudad"]}
          reason={`${HUNDRED_FOLLOWERS} Meta tampoco permite elegir fechas: la entrega para períodos fijos, como los últimos 30 o 90 días.`}
        />
      </ReportSection>

      <ReportSection title="Qué funcionó" question="¿Qué piezas rindieron más?">
        <ContentInsights content={dashboard.topContent} />
      </ReportSection>
    </>
  );

  /**
   * Datos para la card destacada: la serie ya cerrada del período y la comparación
   * contra el período anterior, calculada acá para que coincida con el resto del informe.
   */
  function heroCard(title: string, total: PeriodTotal, key: "views" | "interactions") {
    const data = window.flatMap((point) =>
      point[key] === null ? [] : [{ value: point[key], date: point.label }],
    );
    const comparable = total.current !== null && total.reportedDays === total.days && total.previous !== null && total.previous > 0;
    const trend = comparable ? calculateTrend(total.current!, total.previous!, true) : null;

    return {
      title,
      data,
      total: formatCompact(total.current),
      period: `Últimos ${days} días`,
      percent: trend && trend.direction !== "unavailable" ? `${formatDecimal(Math.abs(trend.percentage ?? 0))}%` : null,
      trend: (trend?.direction === "up" || trend?.direction === "down" ? trend.direction : "flat") as CardTrend,
    };
  }

  function deltaFor(total: PeriodTotal): TileDelta | undefined {
    if (total.current === null) return undefined;
    if (total.reportedDays < total.days) {
      return { direction: "unavailable", text: `${total.reportedDays} de ${total.days} días con datos` };
    }
    if (total.previous === null) {
      return { direction: "unavailable", text: "Sin período anterior completo para comparar" };
    }
    if (total.previous === 0) {
      return {
        direction: "unavailable",
        text: total.current === 0 ? "Sin actividad en ambos períodos" : "Sin actividad en el período anterior",
      };
    }

    const trend = calculateTrend(total.current, total.previous, true);
    if (trend.direction === "flat") return { direction: "flat", text: "Igual que el período anterior" };

    return {
      direction: trend.direction,
      text: `${trend.direction === "up" ? "↗" : "↘"} ${formatDecimal(Math.abs(trend.percentage ?? 0))}% vs los ${days} días anteriores`,
    };
  }
}

const pendingSync = "Se completa con la próxima sincronización";

/** Cifra con signo explícito: "+2", "−1", "0". */
function signed(value: number, format: (value: number) => string) {
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${format(Math.abs(value))}`;
}

function toPoints(points: readonly InstagramDailyMetric[], keys: readonly (keyof InstagramDailyMetric)[]): ChartPoint[] {
  return points.map((point) => ({
    date: point.date,
    label: point.label,
    values: Object.fromEntries(keys.map((key) => [key, point[key] as number | null])),
  }));
}

function weekdayName(short: string) {
  const names: Record<string, string> = {
    Lun: "lunes",
    Mar: "martes",
    Mié: "miércoles",
    Jue: "jueves",
    Vie: "viernes",
    Sáb: "sábados",
    Dom: "domingos",
  };
  return names[short] ?? short;
}
