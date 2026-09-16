"use client";

/**
 * Progress Metric Card — 21st.dev, @makviesainte.
 *
 * Adaptada a Zenovi:
 * - superficie clara con los tokens del sistema en lugar de los de shadcn;
 * - textos en español y cifras en K/M como Instagram;
 * - sin selector de período interno: el período lo manda el filtro de la página;
 * - la comparación puede llegar calculada desde afuera (`percent`, `trend`) para no
 *   contradecir al resto del informe, que compara contra el período anterior;
 * - la variación del pie se colorea por su propio signo, no por la tendencia del período.
 */
import { useId, useMemo, useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import {
  ACCENTS,
  formatCompact,
  MetricChart,
  SERIES_COLORS,
  type ChartSeries,
  type ChartView,
  type MetricAccent,
  type MetricSeries,
  type SeriesPoint,
} from "./metric-chart";
import { ViewToggle } from "./metric-controls";

export type { SeriesPoint, MetricSeries, MetricAccent, ChartView };

export type CardSize = "sm" | "md" | "lg";
export type CardTrend = "up" | "down" | "flat";

export interface ProgressMetricCardProps {
  title: string;
  total?: string | number;
  delta?: string;
  deltaLabel?: string;
  /** `null` oculta la comparación; sin definir, se calcula entre el primer y el último punto. */
  percent?: string | null;
  trend?: CardTrend;
  unit?: string;
  /** Etiqueta del período vigente. Sólo informa: el período se elige fuera de la card. */
  period?: string;
  defaultView?: ChartView;
  accent?: MetricAccent;
  /** Serie única. Usar esto o `series`. */
  data?: SeriesPoint[];
  /** Varias series con nombre. Tiene prioridad sobre `data`. */
  series?: MetricSeries[];
  size?: CardSize;
  /** Muestra máximo, mínimo y promedio en el pie. */
  showStats?: boolean;
  valueFormatter?: (value: number) => string;
  dateFormatter?: (date: string) => string;
  loading?: boolean;
  className?: string;
}

// Parte de la card, desde la derecha, que ocupa el gráfico. La original usa 62 %:
// en dos cards lado a lado el fondo pisaba demasiado al número.
const REGION_W = 50; // %
// Una variación menor a esto se considera estable: acento neutro.
const NEUTRAL_PCT = 0.5;

const SIZES: Record<
  CardSize,
  { minH: string; pad: string; footer: string; title: string; headline: string }
> = {
  // La cifra de `sm` iguala a la del embudo: las cards del informe se leen a la par.
  sm: { minH: "min-h-[260px]", pad: "px-5 pt-5", footer: "px-5 py-3", title: "text-[15px]", headline: "text-[30px]" },
  md: { minH: "min-h-[380px]", pad: "px-8 pt-7", footer: "px-8 py-4", title: "text-[17px]", headline: "text-[72px]" },
  lg: { minH: "min-h-[460px]", pad: "px-10 pt-9", footer: "px-10 py-5", title: "text-[19px]", headline: "text-[88px]" },
};

export default function ProgressMetricCard({
  title,
  total,
  delta,
  deltaLabel = "vs día anterior",
  percent,
  trend,
  unit,
  period,
  defaultView = "curve",
  accent,
  data,
  series,
  size = "md",
  showStats = true,
  valueFormatter,
  dateFormatter,
  loading = false,
  className = "",
}: ProgressMetricCardProps) {
  const gridId = `grid-${useId().replace(/:/g, "")}`;
  const sz = SIZES[size];
  const shell = `relative flex ${sz.minH} w-full flex-col overflow-hidden rounded-card border border-mist bg-paper ${className}`;

  const [view, setView] = useState<ChartView>(defaultView);

  // Normaliza la entrada a una lista de series (un `data` simple es una serie).
  const visibleSeries: MetricSeries[] = useMemo(
    () => (series?.length ? series : [{ name: title, data: data ?? [], accent }]),
    [series, data, title, accent],
  );

  const primary = visibleSeries[0];
  const isMulti = visibleSeries.length > 1;
  const hasData = (primary?.data.length ?? 0) >= 2;

  const stats = useMemo(() => {
    const vals = primary?.data.map((d) => d.value) ?? [];
    const sum = vals.reduce((a, b) => a + b, 0);
    const first = vals[0] ?? 0;
    const last = vals[vals.length - 1] ?? 0;
    const prev = vals[vals.length - 2] ?? first;
    const net = last - first;
    return {
      sum,
      net,
      pct: first ? (net / first) * 100 : 0,
      step: last - prev,
      peak: vals.length ? Math.max(...vals) : 0,
      low: vals.length ? Math.min(...vals) : 0,
      avg: vals.length ? sum / vals.length : 0,
    };
  }, [primary]);

  const resolvedTrend: CardTrend =
    trend ?? (Math.abs(stats.pct) < NEUTRAL_PCT ? "flat" : stats.net >= 0 ? "up" : "down");
  // El gráfico va siempre en el azul de datos, como el resto del informe: quien dice si
  // subió o bajó es la variación, no la línea. Así las cards conviven sin cambiar de color.
  const resolvedAccent: MetricAccent = accent ?? "data";
  const color = ACCENTS[resolvedAccent];
  const trendColor =
    resolvedTrend === "up"
      ? ACCENTS.emerald.text
      : resolvedTrend === "down"
        ? ACCENTS.rose.text
        : ACCENTS.neutral.text;
  // Diagonal para subir y bajar: una flecha recta se lee como "ir a", no como tendencia.
  const TrendIcon =
    resolvedTrend === "flat" ? ArrowRight : resolvedTrend === "down" ? ArrowDownRight : ArrowUpRight;

  const fmtCompact = valueFormatter ?? formatCompact;
  const fmtFull =
    valueFormatter ?? ((n: number) => n.toLocaleString("es-UY") + (unit ? ` ${unit}` : ""));
  const fmtDate = dateFormatter ?? ((d: string) => d);
  const sign = (n: number) => (n > 0 ? "+" : n < 0 ? "−" : "") + fmtCompact(Math.abs(n));

  const displayTotal = total ?? fmtCompact(stats.sum);
  const displayDelta = delta ?? sign(stats.step);
  const displayPercent = percent === undefined ? `${Math.abs(stats.pct).toFixed(1)}%` : percent;
  // La variación del último día tiene su propio signo, independiente del período.
  const deltaColor =
    delta !== undefined || stats.step === 0
      ? ACCENTS.neutral.text
      : stats.step > 0
        ? ACCENTS.emerald.text
        : ACCENTS.rose.text;

  const chartSeries: ChartSeries[] = visibleSeries.map((s, i) => ({
    name: s.name,
    data: s.data,
    color: s.accent
      ? ACCENTS[s.accent].stroke
      : isMulti
        ? SERIES_COLORS[i % SERIES_COLORS.length]
        : color.stroke,
  }));


  if (loading) {
    return (
      <div className={shell} aria-busy="true">
        <div className={`flex flex-1 flex-col ${sz.pad}`}>
          <div className="flex items-center justify-between">
            <div className="h-5 w-32 animate-pulse rounded bg-control" />
            <div className="h-5 w-24 animate-pulse rounded bg-control" />
          </div>
          <div className="mt-6 h-14 w-48 animate-pulse rounded-lg bg-control" />
          <div className="mt-auto h-24 w-full animate-pulse rounded-lg bg-control/60" />
        </div>
        <div className={`border-t border-mist ${sz.footer}`}>
          <div className="h-4 w-40 animate-pulse rounded bg-control" />
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className={shell}>
        <div className={`flex flex-1 flex-col ${sz.pad}`}>
          <h3 className={`${sz.title} font-semibold tracking-tight text-ink`}>{title}</h3>
          <div className="flex flex-1 flex-col items-center justify-center gap-1 py-10 text-center">
            <p className="text-sm font-medium text-ink">Todavía no hay datos</p>
            <p className="text-xs text-muted">
              La métrica aparece cuando Instagram informe al menos dos días del período.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={shell}>
      {/* Zona del gráfico, a la derecha y detrás del contenido */}
      <div className="absolute inset-y-0 right-0 z-0" style={{ width: `${REGION_W}%` }}>
        {/* El tinte sólo dice algo cuando hay dirección: en verde que subió, en rojo que
            bajó. Sin variación, un fondo gris es ruido, así que no se pinta. */}
        {resolvedAccent === "neutral" ? null : (
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(to left, ${color.stroke}0d, transparent 78%)` }}
          />
        )}
        <div
          className="absolute inset-0 text-ink/[0.07]"
          style={{
            WebkitMaskImage: "linear-gradient(to right, transparent, black 55%)",
            maskImage: "linear-gradient(to right, transparent, black 55%)",
          }}
        >
          <svg className="h-full w-full" aria-hidden>
            <defs>
              <pattern id={gridId} width="14" height="14" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${gridId})`} />
          </svg>
        </div>

        <MetricChart
          series={chartSeries}
          view={view}
          valueFormatter={fmtFull}
          dateFormatter={fmtDate}
        />
      </div>

      {/* Contenido principal */}
      <div className={`pointer-events-none relative z-10 flex flex-1 flex-col ${sz.pad}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className={`${sz.title} font-semibold tracking-tight text-ink`}>{title}</h3>
            <ViewToggle value={view} onChange={setView} />
          </div>
          <div className="font-support flex items-center gap-3 text-[13px]">
            {displayPercent !== null ? (
              <span className="flex items-center gap-1 font-medium" style={{ color: trendColor }}>
                <TrendIcon size={15} strokeWidth={2} aria-hidden />
                {displayPercent}
              </span>
            ) : null}
            {period ? <span className="text-graphite">{period}</span> : null}
          </div>
        </div>

        {isMulti && (
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
            {chartSeries.map((s) => (
              <span key={s.name} className="flex items-center gap-1.5 text-[12px] text-graphite">
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                {s.name}
              </span>
            ))}
          </div>
        )}

        <div className={`font-numeric mt-5 ${sz.headline} font-bold leading-none tracking-tight text-ink`}>
          {displayTotal}
        </div>
      </div>

      {/* Pie opaco: variación a la izquierda, estadísticas a la derecha */}
      <div
        className={`font-support relative z-10 flex items-center justify-between gap-4 border-t border-mist bg-paper ${sz.footer} text-[13px]`}
      >
        <div>
          <span className="font-numeric font-medium" style={{ color: deltaColor }}>
            {displayDelta}
          </span>{" "}
          <span className="text-muted">{deltaLabel}</span>
        </div>
        {showStats && (
          <div className="flex items-center gap-2.5 text-[12px] text-muted">
            <span>
              <span className="font-numeric font-medium text-graphite">{fmtCompact(stats.peak)}</span> máx.
            </span>
            <span className="opacity-40">·</span>
            <span>
              <span className="font-numeric font-medium text-graphite">{fmtCompact(stats.low)}</span> mín.
            </span>
            <span className="opacity-40">·</span>
            <span>
              <span className="font-numeric font-medium text-graphite">{fmtCompact(Math.round(stats.avg))}</span> prom.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

