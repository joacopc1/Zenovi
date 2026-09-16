import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { AnimatedNumber, type NumberFormat } from "@/components/analytics/animated-number";
import { getTrendColorClass, type TrendComparison } from "@/components/home/trend";
import { CardTitle, HelpHint } from "@/components/analytics/report-blocks";
import { formatDecimal } from "@/lib/format/numbers";

/**
 * Card de cifra principal con su embudo debajo (21st.dev, "Total Sales Chart" de @Rustemxxx).
 *
 * Adaptada a Zenovi: la cifra encabeza, la gráfica muestra su evolución y las filas de
 * abajo son los pasos siguientes del mismo recorrido, cada uno con su variación. Se
 * quitó el selector de período propio del original —el informe ya tiene uno solo para
 * todo— y el botón de reporte, que acá no lleva a ningún lado.
 */
export type FunnelRow = {
  key: string;
  label: string;
  icon: ReactNode;
  /** Explicación breve, para una métrica que se presta a confusión. */
  hint?: string;
  value: number | null;
  format?: NumberFormat;
  /** `null` cuando no hay período anterior con el que comparar. */
  trend: TrendComparison | null;
};

export function FunnelChartCard({
  title,
  hint,
  value,
  format = "compact",
  trend,
  period,
  chart,
  rows,
}: {
  title: string;
  hint?: string;
  value: number | null;
  format?: NumberFormat;
  trend: TrendComparison | null;
  period: string;
  chart: ReactNode;
  rows: FunnelRow[];
}) {
  return (
    <div className="flex h-full flex-col rounded-card border border-mist bg-paper p-5">
      <CardTitle
        title={title}
        hint={hint}
        trailing={<span className="font-support text-xs text-muted">{period}</span>}
      />

      <div className="mt-3 flex items-center gap-2">
        <span className="font-numeric text-[30px] font-bold leading-none tracking-[-0.02em]">
          <AnimatedNumber value={value} format={format} />
        </span>
        <TrendBadge trend={trend} />
      </div>

      <div className="mb-5 mt-4">{chart}</div>

      <dl className="mt-auto flex flex-col gap-3 border-t border-mist pt-4">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-3">
            <dt className="font-support flex items-center gap-2.5 text-[13px] text-ink">
              <span aria-hidden="true" className="flex text-graphite">
                {row.icon}
              </span>
              {row.label}
              {row.hint ? <HelpHint text={row.hint} /> : null}
            </dt>
            <dd className="flex items-center gap-3">
              <span className="font-numeric text-[13px] font-semibold">
                <AnimatedNumber value={row.value} format={row.format ?? "compact"} />
              </span>
              <TrendNote trend={row.trend} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function TrendBadge({ trend }: { trend: TrendComparison | null }) {
  if (trend === null || trend.direction === "unavailable" || trend.percentage === null) return null;

  // Sin píldora: el color y la flecha ya distinguen la variación del número grande.
  return (
    <span
      className={`font-numeric flex items-center gap-0.5 text-[13px] font-semibold ${getTrendColorClass(trend.direction)}`}
    >
      {trend.direction === "up" ? <ArrowUpRight size={14} strokeWidth={2} aria-hidden /> : null}
      {trend.direction === "down" ? <ArrowDownRight size={14} strokeWidth={2} aria-hidden /> : null}
      {signedPercent(trend.percentage)}
    </span>
  );
}

/** Sin período anterior no se inventa una flecha: queda el espacio en blanco. */
function TrendNote({ trend }: { trend: TrendComparison | null }) {
  if (trend === null || trend.direction === "unavailable" || trend.percentage === null) {
    return <span className="w-14 text-right text-xs text-muted">—</span>;
  }

  return (
    <span
      className={`font-numeric flex w-14 items-center justify-end gap-0.5 text-xs font-semibold ${getTrendColorClass(trend.direction)}`}
    >
      {trend.direction === "up" ? <ArrowUpRight size={13} strokeWidth={2} aria-hidden /> : null}
      {trend.direction === "down" ? <ArrowDownRight size={13} strokeWidth={2} aria-hidden /> : null}
      {signedPercent(trend.percentage)}
    </span>
  );
}

function signedPercent(percentage: number) {
  const sign = percentage > 0 ? "+" : percentage < 0 ? "−" : "";
  return `${sign}${formatDecimal(Math.abs(percentage))}%`;
}
