import type { RankedContentItem } from "@/lib/content/library";
import {
  getContentBenchmark,
  type ContentBenchmarkKey,
} from "@/lib/content/metrics";
import { ChartNoAxesColumnIncreasing } from "lucide-react";
import { PerformanceBadge } from "./performance-badge";

const numberFormatter = new Intl.NumberFormat("es-UY");
const decimalFormatter = new Intl.NumberFormat("es-UY", { maximumFractionDigits: 1 });

const definitions: {
  key: ContentBenchmarkKey;
  label: string;
  format: "number" | "percentage";
}[] = [
  { key: "views", label: "Visualizaciones", format: "number" },
  { key: "engagement", label: "Engagement", format: "percentage" },
  { key: "saves", label: "Guardados / views", format: "percentage" },
  { key: "shares", label: "Compartidos / views", format: "percentage" },
];

export function BenchmarkSection({
  cohort,
  item,
}: {
  cohort: RankedContentItem[];
  item: RankedContentItem;
}) {
  const benchmarks = definitions.flatMap((definition) => {
    const benchmark = getContentBenchmark(cohort, item.id, definition.key);
    return benchmark ? [{ ...definition, benchmark }] : [];
  });

  return (
    <section className="rounded-card border border-mist bg-paper px-5 py-4" aria-labelledby="benchmark-title">
      <header className="border-b border-mist pb-4">
        <h2 id="benchmark-title" className="flex items-center gap-2 text-[15px] font-semibold text-ink">
          <ChartNoAxesColumnIncreasing aria-hidden="true" className="size-4 text-ink" strokeWidth={1.7} />
          Comparación con tu cuenta
        </h2>
        <p className="font-support mt-1 text-[13px] text-graphite">
          Esta pieza frente a la mediana de tus otras piezas del mismo formato.
        </p>
      </header>

      {benchmarks.length === 0 ? (
        <p className="font-support py-4 text-[13px] leading-5 text-graphite">
          Se activa cuando haya al menos 3 piezas del mismo formato con métricas comparables.
        </p>
      ) : (
        <dl className="mt-4 space-y-5">
          {benchmarks.map(({ key, label, format, benchmark }) => {
            const scale = Math.max(benchmark.current, benchmark.median, 1);

            return (
              <div key={key}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <dt className="font-support text-[13px] font-medium text-ink">{label}</dt>
                  <dd className="flex items-center gap-2">
                    <span className="font-numeric text-[14px] font-semibold text-ink tabular-nums">
                      {formatValue(benchmark.current, format)}
                    </span>
                    <PerformanceBadge multiplier={benchmark.multiplier} />
                  </dd>
                </div>

                <dd className="mt-2 space-y-1.5">
                  <ComparisonBar
                    label="Esta pieza"
                    value={benchmark.current}
                    scale={scale}
                    emphasized
                  />
                  <ComparisonBar label="Mediana" value={benchmark.median} scale={scale} />
                </dd>
                <dd className="font-support mt-1.5 text-[11px] text-muted">
                  Referencia calculada con {benchmark.sampleSize} piezas comparables
                </dd>
              </div>
            );
          })}
        </dl>
      )}
    </section>
  );
}

function ComparisonBar({
  label,
  value,
  scale,
  emphasized = false,
}: {
  label: string;
  value: number;
  scale: number;
  emphasized?: boolean;
}) {
  return (
    <div className="grid grid-cols-[70px_minmax(0,1fr)] items-center gap-3">
      <span className="font-support text-[11px] text-graphite">{label}</span>
      <span className="h-1.5 overflow-hidden rounded-full bg-control" aria-hidden="true">
        <span
          className={`block h-full rounded-full ${emphasized ? "bg-data" : "bg-graphite/35"}`}
          style={{ width: `${Math.max(value > 0 ? 2 : 0, (value / scale) * 100)}%` }}
        />
      </span>
    </div>
  );
}

function formatValue(value: number, format: "number" | "percentage") {
  return format === "percentage"
    ? `${decimalFormatter.format(value)} %`
    : numberFormatter.format(Math.round(value));
}
