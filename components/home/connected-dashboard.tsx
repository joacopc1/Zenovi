import { ContentPerformance } from "./content-performance";
import { DashboardMetricCard } from "./dashboard-metric-card";
import { SyncButton } from "./sync-button";
import { SyncNotice } from "./sync-notice";
import { calculateTrend, type TrendDirection } from "./trend";
import type { InstagramDashboardData } from "@/lib/data/instagram-dashboard";
import { buildHomeBrief } from "@/lib/insights/home-brief";

type DashboardMetric = {
  id: string;
  label: string;
  value: string;
  comparison: string;
  values: (number | null)[];
  available: boolean;
  trend: TrendDirection;
  period?: string;
};

const numberFormatter = new Intl.NumberFormat("es-UY");

export function ConnectedDashboard({
  dashboard,
  syncStatus,
}: {
  dashboard: InstagramDashboardData;
  syncStatus?: string;
}) {
  const priority = dashboard.priority;

  const availableMetrics = new Set(dashboard.availableAccountMetrics);
  const availableDailyMetrics = new Set(dashboard.availableDailyMetrics);
  const homeMetrics = dashboard.dailyMetrics.slice(-7);
  const labels = homeMetrics.map((point) => point.label);
  const hasInteractions = availableMetrics.has("total_interactions");
  const hasMediaInteractions = dashboard.totalMediaInteractions !== null;
  const metrics: DashboardMetric[] = [
    {
      id: "views-trend",
      label: "Visualizaciones",
      value: formatMetric(dashboard.sevenDayViews, availableMetrics.has("views")),
      ...describeTrend(
        dashboard.sevenDayViews,
        dashboard.previousSevenDayViews,
        availableMetrics.has("views"),
      ),
      values: homeMetrics.map((point) => point.views),
      available: availableDailyMetrics.has("views"),
    },
    {
      id: "reach-trend",
      label: "Alcance",
      value: formatMetric(dashboard.sevenDayReach, availableMetrics.has("reach")),
      ...describeTrend(
        dashboard.sevenDayReach,
        dashboard.previousSevenDayReach,
        availableMetrics.has("reach"),
      ),
      values: homeMetrics.map((point) => point.reach),
      available: availableDailyMetrics.has("reach"),
    },
    {
      id: "interactions-trend",
      label: hasInteractions ? "Interacciones" : "Interacciones de contenido",
      value: hasInteractions
        ? formatNumber(dashboard.sevenDayInteractions)
        : formatMetric(dashboard.totalMediaInteractions, hasMediaInteractions),
      ...(hasInteractions
        ? describeTrend(
            dashboard.sevenDayInteractions,
            dashboard.previousSevenDayInteractions,
            true,
          )
        : {
            comparison: hasMediaInteractions
              ? `${dashboard.syncedMediaCount} publicaciones sincronizadas`
              : "Instagram no devolvió este dato",
            trend: "unavailable" as const,
          }),
      values: homeMetrics.map((point) => point.interactions),
      available: availableDailyMetrics.has("total_interactions"),
      period: hasInteractions ? "7 días" : "Contenido",
    },
  ];
  const brief = priority
    ? buildHomeBrief({
        followers: dashboard.followers,
        syncedMediaCount: dashboard.syncedMediaCount,
        priority,
      })
    : null;

  return (
    <>
      <SyncNotice key={syncStatus} status={syncStatus} />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.02em]">Dashboard</h1>
          <p className="mt-1 text-[13px] text-muted">
            @{dashboard.username}
            {dashboard.lastSyncedAt ? ` · actualizado ${formatSyncDate(dashboard.lastSyncedAt)}` : ""}
          </p>
        </div>
        <SyncButton redirectTo="/" />
      </header>

      <section aria-label="Resumen de rendimiento" className="mt-6 grid gap-4 lg:grid-cols-3">
        {metrics.map((metric) => (
          <DashboardMetricCard key={metric.id} {...metric} labels={labels} />
        ))}
      </section>

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <ContentPerformance content={dashboard.topContent} />

        <div className="grid gap-4">
          <section className="rounded-card border border-mist bg-paper p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">Cuenta</h2>
              <span className="size-2 rounded-full bg-success" title="Instagram conectado" />
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-5">
              <div>
                <dt className="text-xs text-muted">Seguidores</dt>
                <dd className="mt-1.5 text-xl font-semibold tabular-nums">
                  {formatMetric(dashboard.followers, dashboard.followers !== null)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Piezas sincronizadas</dt>
                <dd className="mt-1.5 text-xl font-semibold tabular-nums">
                  {formatNumber(dashboard.syncedMediaCount)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-card border border-mist bg-paper p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">Señal de IA</h2>
              <span className="text-[11px] text-muted">Experimental</span>
            </div>
            <p className="mt-4 text-base font-semibold leading-6">
              {brief?.title ?? "Todavía no hay alcance suficiente para comparar."}
            </p>
            <p className="mt-2 text-[13px] leading-5 text-graphite">
              {brief?.nextAction ?? "Sincronizá nuevamente cuando tus publicaciones acumulen datos."}
            </p>
            {priority?.permalink ? (
              <a
                href={priority.permalink}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex text-xs font-semibold underline underline-offset-4"
              >
                Ver pieza relacionada →
              </a>
            ) : null}
          </section>
        </div>
      </div>
    </>
  );
}

function formatNumber(value: number) {
  return numberFormatter.format(Math.round(value));
}

function formatMetric(value: number | null, available: boolean) {
  return available && value !== null ? formatNumber(value) : "—";
}

function describeTrend(
  current: number,
  previous: number,
  available: boolean,
): Pick<DashboardMetric, "comparison" | "trend"> {
  const result = calculateTrend(current, previous, available);

  if (!available) {
    return { comparison: "Instagram no devolvió este dato", trend: "unavailable" };
  }
  if (previous === 0) {
    return {
      comparison: current === 0
        ? "Sin actividad en los últimos 7 días"
        : "Sin base comparable anterior",
      trend: "unavailable",
    };
  }

  if (result.direction === "flat") {
    return { comparison: "Sin cambios frente al período anterior", trend: "flat" };
  }

  return {
    comparison: `${result.direction === "up" ? "Subió" : "Bajó"} ${formatNumber(Math.abs(result.percentage ?? 0))}% frente a los 7 días anteriores`,
    trend: result.direction,
  };
}

function formatSyncDate(value: string) {
  return new Intl.DateTimeFormat("es-UY", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Montevideo",
  }).format(new Date(value));
}
