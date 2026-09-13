"use client";

import { useMemo, useState } from "react";
import { calculateTrend, getTrendColorClass } from "@/components/home/trend";
import { TrendChart } from "@/components/home/trend-chart";
import type {
  InstagramAccountMetricSummary,
  InstagramDailyMetric,
} from "@/lib/data/instagram-dashboard";

type MetricKey = "views" | "reach" | "interactions";

const metricDefinitions: {
  key: MetricKey;
  label: string;
  apiMetric: string;
}[] = [
  { key: "views", label: "Visualizaciones", apiMetric: "views" },
  { key: "reach", label: "Alcance", apiMetric: "reach" },
  { key: "interactions", label: "Interacciones", apiMetric: "total_interactions" },
];

const numberFormatter = new Intl.NumberFormat("es-UY");

export function AnalyticsOverview({
  series,
  availableMetrics,
  availableDailyMetrics,
  summaries,
}: {
  series: InstagramDailyMetric[];
  availableMetrics: string[];
  availableDailyMetrics: string[];
  summaries: InstagramAccountMetricSummary[];
}) {
  const available = useMemo(() => new Set(availableMetrics), [availableMetrics]);
  const dailyAvailable = useMemo(
    () => new Set(availableDailyMetrics),
    [availableDailyMetrics],
  );
  const summaryByMetric = useMemo(
    () => new Map(summaries.map((summary) => [summary.metric, summary])),
    [summaries],
  );
  const [selectedKey, setSelectedKey] = useState<MetricKey>(() =>
    metricDefinitions.find((metric) => dailyAvailable.has(metric.apiMetric))?.key ??
      metricDefinitions.find((metric) => available.has(metric.apiMetric))?.key ??
      "reach",
  );
  const metrics = metricDefinitions.map((definition) =>
    buildMetric(
      definition,
      series,
      available.has(definition.apiMetric),
      dailyAvailable.has(definition.apiMetric),
      summaryByMetric.get(definition.apiMetric),
    ),
  );
  const selected = metrics.find((metric) => metric.key === selectedKey) ?? metrics[0];

  return (
    <section className="mt-6 overflow-hidden rounded-card border border-mist bg-paper">
      <div className="grid divide-y divide-mist border-b border-mist md:grid-cols-3 md:divide-x md:divide-y-0">
        {metrics.map((metric) => {
          const active = metric.key === selected.key;

          return (
            <button
              key={metric.key}
              type="button"
              onClick={() => setSelectedKey(metric.key)}
              aria-pressed={active}
              className={`min-h-24 px-5 py-4 text-left transition-colors hover:bg-canvas ${active ? "bg-canvas" : "bg-paper"}`}
            >
              <span className="flex items-center justify-between gap-3 text-[13px] font-medium text-graphite">
                {metric.label}
                <small className="text-[11px] font-normal text-muted">7 días</small>
              </span>
              <span className="mt-2 flex items-end justify-between gap-3">
                <strong className="text-2xl font-semibold tracking-[-0.025em] tabular-nums">
                  {metric.available ? formatNumber(metric.total) : "—"}
                </strong>
                <small className={`pb-0.5 text-xs ${getTrendColorClass(metric.trend.direction)}`}>
                  {formatTrend(metric)}
                </small>
              </span>
            </button>
          );
        })}
      </div>

      <div className="px-5 pb-5 pt-4 md:px-6 md:pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Evolución de {selected.label.toLocaleLowerCase("es")}</h2>
            <p className="mt-1 text-xs text-muted">
              {selected.dailyAvailable
                ? "Valor diario informado por Instagram"
                : "Instagram no ofrece esta serie diaria en la conexión actual"}
            </p>
          </div>
          <span className="rounded-full bg-control px-2.5 py-1 text-xs font-medium text-graphite">
            {series.length} días
          </span>
        </div>
        <TrendChart
          id={`analytics-${selected.key}`}
          values={selected.values}
          labels={series.map((point) => point.label)}
          label={selected.label}
          available={selected.dailyAvailable}
          trend={selected.trend.direction}
          variant="detail"
          tone="data"
        />
      </div>
    </section>
  );
}

function buildMetric(
  definition: (typeof metricDefinitions)[number],
  series: InstagramDailyMetric[],
  available: boolean,
  dailyAvailable: boolean,
  summary?: InstagramAccountMetricSummary,
) {
  const values = series.map((point) => point[definition.key]);
  const current = summary?.current ?? 0;
  const previous = summary?.previous ?? 0;

  return {
    ...definition,
    available,
    dailyAvailable,
    values,
    total: current,
    trend: calculateTrend(current, previous, available),
    current,
    previous,
  };
}

function formatTrend(metric: ReturnType<typeof buildMetric>) {
  if (!metric.available) return "Sin datos";
  if (metric.previous === 0) return metric.current === 0 ? "Sin actividad" : "Sin comparación";
  if (metric.trend.direction === "flat") return "Sin cambios";

  const arrow = metric.trend.direction === "up" ? "↗" : "↘";
  return `${arrow} ${formatNumber(Math.abs(metric.trend.percentage ?? 0))}%`;
}

function formatNumber(value: number) {
  return numberFormatter.format(Math.round(value));
}
