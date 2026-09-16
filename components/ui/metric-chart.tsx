"use client";

/**
 * Gráfico de fondo de la Progress Metric Card (21st.dev, @makviesainte).
 *
 * El registro no publica este archivo sin autenticación: se reconstruyó a partir del
 * contrato que usa `progress-metric-card.tsx` —mismas exportaciones, mismos tipos— y de
 * la descripción del autor ("rendered with Recharts, switchable between a smooth
 * progression curve and bars"). Colores y textos adaptados a Zenovi.
 */
import { useId, useMemo, useSyncExternalStore } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompact } from "@/lib/format/numbers";

export { formatCompact };

export type SeriesPoint = { value: number; date: string };
export type MetricAccent = "emerald" | "rose" | "neutral" | "data";
export type MetricSeries = { name: string; data: SeriesPoint[]; accent?: MetricAccent };
export type ChartSeries = { name: string; data: SeriesPoint[]; color: string };
export type ChartView = "curve" | "bars";

/**
 * En hexadecimal a propósito: la card arma el degradado concatenando un canal alfa
 * (`${stroke}1f`), cosa que no admite una variable CSS. Son los mismos valores que
 * `--color-success`, `--color-danger`, `--color-graphite` y `--color-data`.
 */
export const ACCENTS: Record<MetricAccent, { stroke: string; text: string }> = {
  emerald: { stroke: "#1d754b", text: "#1d754b" },
  rose: { stroke: "#c33c45", text: "#c33c45" },
  neutral: { stroke: "#6e6e73", text: "#6e6e73" },
  data: { stroke: "#4f6fd8", text: "#4f6fd8" },
};

/** Orden fijo validado para daltonismo; los mismos valores que `--color-series-*`. */
export const SERIES_COLORS = ["#4f6fd8", "#eb6834", "#1baf7a", "#eda100"];

/** Deja espacio al encabezado arriba y al pie opaco abajo, que tapan el fondo. */
const CHART_MARGIN = { top: 64, right: 0, bottom: 52, left: 0 };

export function MetricChart({
  series,
  view,
  valueFormatter,
  dateFormatter,
}: {
  series: ChartSeries[];
  view: ChartView;
  valueFormatter: (value: number) => string;
  dateFormatter: (date: string) => string;
}) {
  const gradientId = `metric-${useId().replace(/:/g, "")}`;
  const reduceMotion = usePrefersReducedMotion();

  // Una fila por día; cada serie en su columna `s0`, `s1`…
  const rows = useMemo(
    () =>
      (series[0]?.data ?? []).map((point, index) => ({
        date: point.date,
        ...Object.fromEntries(series.map((item, position) => [`s${position}`, item.data[index]?.value ?? null])),
      })),
    [series],
  );

  const tooltip = (
    <Tooltip
      cursor={false}
      isAnimationActive={false}
      content={({ active, payload }) => {
        if (!active || !payload?.length) return null;
        const row = payload[0].payload as { date: string };

        return (
          <div className="rounded-control border border-mist bg-paper px-3 py-2 shadow-[0_8px_20px_rgba(0,0,0,0.08)]">
            {payload.map((item) => (
              <p key={String(item.dataKey)} className="text-[13px] font-semibold text-ink">
                {typeof item.value === "number" ? valueFormatter(item.value) : "Sin dato"}
              </p>
            ))}
            <p className="mt-0.5 text-[11px] text-muted">{dateFormatter(row.date)}</p>
          </div>
        );
      }}
    />
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      {view === "bars" ? (
        <BarChart data={rows} margin={CHART_MARGIN} barCategoryGap="20%">
          <XAxis dataKey="date" hide />
          <YAxis hide domain={[0, "dataMax"]} />
          {tooltip}
          {series.map((item, position) => (
            <Bar
              key={item.name}
              dataKey={`s${position}`}
              fill={item.color}
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
              isAnimationActive={!reduceMotion}
            />
          ))}
        </BarChart>
      ) : (
        <AreaChart data={rows} margin={CHART_MARGIN}>
          <defs>
            {series.map((item, position) => (
              <linearGradient key={item.name} id={`${gradientId}-${position}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={item.color} stopOpacity={0.14} />
                <stop offset="100%" stopColor={item.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <XAxis dataKey="date" hide />
          <YAxis hide domain={["dataMin", "dataMax"]} />
          {tooltip}
          {series.map((item, position) => (
            <Area
              key={item.name}
              type="monotone"
              dataKey={`s${position}`}
              stroke={item.color}
              strokeWidth={2}
              fill={`url(#${gradientId}-${position})`}
              dot={false}
              activeDot={{ r: 4, fill: item.color, stroke: "#ffffff", strokeWidth: 2 }}
              connectNulls
              isAnimationActive={!reduceMotion}
            />
          ))}
        </AreaChart>
      )}
    </ResponsiveContainer>
  );
}

/** Respeta "reducir movimiento" del sistema: sin animación de entrada. */
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}
