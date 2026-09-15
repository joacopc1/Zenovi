"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type RefObject } from "react";
import { formatCompact, formatNumber } from "@/lib/format/numbers";

export type ChartSeries = { key: string; label: string; color: string };
export type ChartPoint = { date: string; label: string; values: Record<string, number | null> };

const PLOT_HEIGHT = 168;
const TOP = 10;
const AXIS_BAND = 26;
const LEFT = 44;
const RIGHT = 8;
const BAR_MAX_WIDTH = 24;
/** Separación en el color de la superficie entre segmentos y barras contiguas. */
const SURFACE_GAP = 2;

/**
 * Serie diaria con eje único: líneas para una evolución, barras apiladas para un
 * reparto por día. Los días sin dato quedan como hueco, nunca como cero.
 */
export function DailyChart({
  label,
  points,
  series,
  mode,
}: {
  label: string;
  points: ChartPoint[];
  series: ChartSeries[];
  mode: "line" | "stacked";
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const width = useElementWidth(containerRef);
  const [active, setActive] = useState<number | null>(null);

  const hasData = points.some((point) => series.some((item) => point.values[item.key] !== null));

  if (!hasData) {
    return (
      <p className="flex h-[204px] items-center justify-center rounded-control bg-canvas px-6 text-center text-xs leading-5 text-muted">
        Instagram todavía no informó este dato en el período. Se completa con las próximas sincronizaciones.
      </p>
    );
  }

  const plotWidth = Math.max(width - LEFT - RIGHT, 0);
  const band = points.length > 0 ? plotWidth / points.length : 0;
  const peaks = points.map((point) =>
    mode === "stacked"
      ? series.reduce((sum, item) => sum + (point.values[item.key] ?? 0), 0)
      : Math.max(0, ...series.map((item) => point.values[item.key] ?? 0)),
  );
  const yMax = niceMax(Math.max(0, ...peaks));
  const yOf = (value: number) => TOP + PLOT_HEIGHT - (value / yMax) * PLOT_HEIGHT;
  const xOf = (index: number) => LEFT + band * (index + 0.5);
  const baseline = TOP + PLOT_HEIGHT;
  const ticks = [0, yMax / 2, yMax];
  const barWidth = Math.max(Math.min(BAR_MAX_WIDTH, band - SURFACE_GAP), 1);

  function moveTo(event: PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const index = Math.floor((event.clientX - bounds.left - LEFT) / band);
    setActive(index >= 0 && index < points.length ? index : null);
  }

  function step(event: KeyboardEvent<SVGSVGElement>) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const delta = event.key === "ArrowLeft" ? -1 : 1;
      setActive((current) =>
        Math.min(points.length - 1, Math.max(0, (current ?? points.length - 1) + delta)),
      );
    }
    if (event.key === "Escape") setActive(null);
  }

  const activePoint = active === null ? null : points[active];
  const tooltipLeft = active === null ? 0 : Math.min(Math.max(xOf(active) - 80, 0), Math.max(width - 160, 0));

  return (
    <div>
      {series.length > 1 ? (
        <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-graphite">
          {series.map((item) => (
            <li key={item.key} className="flex items-center gap-1.5">
              <span aria-hidden="true" className="size-2 rounded-full" style={{ background: item.color }} />
              {item.label}
            </li>
          ))}
        </ul>
      ) : null}

      <div ref={containerRef} className="relative h-[204px]">
        {width > 0 ? (
          <svg
            width={width}
            height={TOP + PLOT_HEIGHT + AXIS_BAND}
            role="img"
            aria-label={`${label}. Usá las flechas para recorrer los días.`}
            tabIndex={0}
            onPointerMove={moveTo}
            onPointerLeave={() => setActive(null)}
            onFocus={() => setActive(points.length - 1)}
            onBlur={() => setActive(null)}
            onKeyDown={step}
            className="block overflow-visible outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
          >
            {ticks.map((tick) => (
              <g key={tick}>
                <line x1={LEFT} x2={width - RIGHT} y1={yOf(tick)} y2={yOf(tick)} stroke="var(--color-mist)" />
                <text x={LEFT - 8} y={yOf(tick) + 3} textAnchor="end" fontSize="10" fill="var(--color-muted)">
                  {formatCompact(tick)}
                </text>
              </g>
            ))}

            {mode === "stacked"
              ? points.map((point, index) => {
                  let top = baseline;
                  const present = series.filter((item) => (point.values[item.key] ?? 0) > 0);

                  return present.map((item, position) => {
                    const height = ((point.values[item.key] ?? 0) / yMax) * PLOT_HEIGHT;
                    const isTop = position === present.length - 1;
                    const x = xOf(index) - barWidth / 2;
                    top -= height;
                    const segmentTop = isTop ? top : top + SURFACE_GAP;
                    const segmentHeight = Math.max(isTop ? height : height - SURFACE_GAP, 0);

                    return isTop ? (
                      <path
                        key={item.key}
                        d={roundedTop(x, segmentTop, barWidth, segmentHeight, Math.min(4, barWidth / 2, segmentHeight))}
                        fill={item.color}
                      />
                    ) : (
                      <rect key={item.key} x={x} y={segmentTop} width={barWidth} height={segmentHeight} fill={item.color} />
                    );
                  });
                })
              : series.map((item) =>
                  runs(points.map((point) => point.values[item.key])).map((run) => {
                    const coordinates = run.map(({ index, value }) => `${xOf(index)},${yOf(value)}`);
                    const first = run[0];
                    const last = run[run.length - 1];

                    return (
                      <g key={`${item.key}-${first.index}`}>
                        {series.length === 1 && run.length > 1 ? (
                          <path
                            d={`M ${coordinates.join(" L ")} L ${xOf(last.index)},${baseline} L ${xOf(first.index)},${baseline} Z`}
                            fill={item.color}
                            opacity="0.1"
                          />
                        ) : null}
                        {run.length > 1 ? (
                          <polyline
                            points={coordinates.join(" ")}
                            fill="none"
                            stroke={item.color}
                            strokeWidth="2"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                          />
                        ) : (
                          <circle cx={xOf(first.index)} cy={yOf(first.value)} r="3" fill={item.color} />
                        )}
                      </g>
                    );
                  }),
                )}

            {active !== null ? (
              <g pointerEvents="none">
                <line x1={xOf(active)} x2={xOf(active)} y1={TOP} y2={baseline} stroke="var(--color-mist-strong)" />
                {mode === "line"
                  ? series.map((item) => {
                      const value = points[active].values[item.key];
                      return value === null ? null : (
                        <circle
                          key={item.key}
                          cx={xOf(active)}
                          cy={yOf(value)}
                          r="4"
                          fill={item.color}
                          stroke="var(--color-paper)"
                          strokeWidth="2"
                        />
                      );
                    })
                  : null}
              </g>
            ) : null}

            {axisLabels(points.length).map(({ index, anchor }) => (
              <text
                key={index}
                x={anchor === "start" ? LEFT : anchor === "end" ? width - RIGHT : xOf(index)}
                y={baseline + 18}
                textAnchor={anchor}
                fontSize="10"
                fill="var(--color-muted)"
              >
                {points[index].label}
              </text>
            ))}
          </svg>
        ) : null}

        {activePoint ? (
          <div
            className="pointer-events-none absolute top-0 z-10 w-40 rounded-control border border-mist bg-paper px-3 py-2 text-xs shadow-[0_8px_20px_rgba(0,0,0,0.08)]"
            style={{ left: tooltipLeft }}
          >
            <p className="font-medium">{activePoint.label}</p>
            <ul className="mt-1 space-y-0.5">
              {series.map((item) => (
                <li key={item.key} className="flex items-center justify-between gap-3 text-graphite">
                  <span className="flex items-center gap-1.5">
                    <span aria-hidden="true" className="size-2 rounded-full" style={{ background: item.color }} />
                    {item.label}
                  </span>
                  <span className="tabular-nums text-ink">
                    {activePoint.values[item.key] === null ? "Sin dato" : formatNumber(activePoint.values[item.key])}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">Día</th>
            {series.map((item) => (
              <th key={item.key} scope="col">{item.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.date}>
              <th scope="row">{point.label}</th>
              {series.map((item) => (
                <td key={item.key}>
                  {point.values[item.key] === null ? "Sin dato" : formatNumber(point.values[item.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function useElementWidth(ref: RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return width;
}

/** Tope del eje redondeado a un valor limpio, con marcas enteras para conteos chicos. */
function niceMax(max: number) {
  if (max <= 2) return 2;

  const magnitude = 10 ** Math.floor(Math.log10(max));
  const nice = [1, 2, 2.5, 5, 10].find((candidate) => candidate * magnitude >= max)! * magnitude;
  return nice < 10 ? Math.ceil(nice / 2) * 2 : nice;
}

function runs(values: (number | null)[]) {
  const result: { index: number; value: number }[][] = [];
  let current: { index: number; value: number }[] = [];

  values.forEach((value, index) => {
    if (value === null) {
      if (current.length > 0) result.push(current);
      current = [];
      return;
    }
    current.push({ index, value });
  });

  if (current.length > 0) result.push(current);
  return result;
}

function axisLabels(count: number) {
  if (count === 0) return [];
  if (count < 3) return [{ index: 0, anchor: "start" as const }];

  return [
    { index: 0, anchor: "start" as const },
    { index: Math.floor((count - 1) / 2), anchor: "middle" as const },
    { index: count - 1, anchor: "end" as const },
  ];
}

function roundedTop(x: number, y: number, width: number, height: number, radius: number) {
  if (height <= 0) return "";
  const r = Math.max(radius, 0);

  return `M ${x} ${y + height} V ${y + r} Q ${x} ${y} ${x + r} ${y} H ${x + width - r} Q ${x + width} ${y} ${x + width} ${y + r} V ${y + height} Z`;
}
