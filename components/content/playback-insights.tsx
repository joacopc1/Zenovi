"use client";

import { Clock3, Gauge, TimerReset } from "lucide-react";
import { getWatchRetentionPercentage } from "@/lib/content/metrics";
import { formatClipDuration, useMediaDuration } from "./use-media-duration";

const decimalFormatter = new Intl.NumberFormat("es-UY", { maximumFractionDigits: 1 });

export function PlaybackInsights({
  averageWatchTimeMs,
  totalWatchTimeMs,
  skipRate,
  mediaUrl,
}: {
  averageWatchTimeMs: number | null;
  totalWatchTimeMs: number | null;
  skipRate: number | null;
  mediaUrl: string | null;
}) {
  const { cardRef, duration } = useMediaDuration<HTMLElement>(mediaUrl);
  const retention = getWatchRetentionPercentage(averageWatchTimeMs, duration);
  const normalizedSkipRate = normalizePercentage(skipRate);

  return (
    <section ref={cardRef} className="rounded-card border border-mist bg-paper px-5 py-5" aria-labelledby="playback-title">
      <h2 id="playback-title" className="flex items-center gap-2 text-[14px] font-semibold text-ink">
        <Gauge aria-hidden="true" className="size-4 text-ink" strokeWidth={1.7} />
        Retención del Reel
      </h2>

      <div className="mt-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-support text-[12px] text-graphite">Tiempo medio visto</p>
            <p className="font-numeric mt-1 text-[26px] font-semibold leading-none tracking-[-0.03em] tabular-nums">
              {formatDuration(averageWatchTimeMs)}
            </p>
          </div>
          <p className="font-numeric text-[13px] font-semibold text-ink tabular-nums">
            {formatPercentage(retention)}
          </p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-control" aria-hidden="true">
          <div
            className="h-full rounded-full bg-data transition-[width] duration-500"
            style={{ width: `${clampPercentage(retention)}%` }}
          />
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-[0.8fr_1.2fr] gap-x-4 gap-y-4 border-t border-mist pt-4">
        <PlaybackMetric
          icon={Clock3}
          label="Duración"
          value={formatClipDuration(duration) ?? "No disponible"}
        />
        <PlaybackMetric
          icon={TimerReset}
          label="Tiempo visto total"
          value={formatDuration(totalWatchTimeMs)}
        />
        <div className="col-span-2">
          <div className="flex items-center justify-between gap-3">
            <dt className="font-support text-[12px] text-ink">Omitió antes de 3 segundos</dt>
            <dd className="font-numeric text-[13px] font-semibold tabular-nums">
              {formatPercentage(normalizedSkipRate)}
            </dd>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-control" aria-hidden="true">
            <div
              className="h-full rounded-full bg-danger/75 transition-[width] duration-500"
              style={{ width: `${clampPercentage(normalizedSkipRate)}%` }}
            />
          </div>
        </div>
      </dl>
    </section>
  );
}

function PlaybackMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="font-support flex items-center gap-1.5 whitespace-nowrap text-[12px] text-ink">
        <Icon aria-hidden="true" className="size-3.5 text-ink" strokeWidth={1.65} />
        {label}
      </dt>
      <dd className="font-numeric mt-1 text-[14px] font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function formatDuration(value: number | null) {
  if (value === null) return "No disponible";
  const seconds = value / 1000;
  return seconds >= 60
    ? `${decimalFormatter.format(seconds / 60)} min`
    : `${decimalFormatter.format(seconds)} s`;
}

function normalizePercentage(value: number | null) {
  if (value === null) return null;
  return value <= 1 ? value * 100 : value;
}

function formatPercentage(value: number | null) {
  return value === null ? "No disponible" : `${decimalFormatter.format(value)} %`;
}

function clampPercentage(value: number | null) {
  return value === null ? 0 : Math.min(100, Math.max(0, value));
}
