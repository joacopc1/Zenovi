import { TrendChart } from "./trend-chart";
import { getTrendColorClass, type TrendDirection } from "./trend";

export function DashboardMetricCard({
  id,
  label,
  value,
  comparison,
  values,
  labels,
  available,
  trend,
  period = "7 días",
}: {
  id: string;
  label: string;
  value: string;
  comparison: string;
  values: (number | null)[];
  labels: string[];
  available: boolean;
  trend: TrendDirection;
  period?: string;
}) {
  return (
    <article className="min-w-0 rounded-card border border-mist bg-paper p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-graphite">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.025em] tabular-nums">{value}</p>
        </div>
        <span className="rounded-full bg-control px-2 py-1 text-[11px] font-medium text-graphite">
          {period}
        </span>
      </div>
      <p className={`mt-1 flex min-h-4 items-center gap-1 text-xs ${getTrendColorClass(trend)}`}>
        {trend === "up" ? <span aria-hidden="true">↗</span> : null}
        {trend === "down" ? <span aria-hidden="true">↘</span> : null}
        {comparison}
      </p>
      <TrendChart
        id={id}
        values={values}
        labels={labels}
        label={label}
        available={available}
        trend={trend}
      />
    </article>
  );
}
