import { TrendingUp } from "lucide-react";
import { DailyChart } from "@/components/analytics/daily-chart";
import type { MediaViewPoint } from "@/lib/content/media-view-evolution";

export function ReelViewsEvolution({ points }: { points: MediaViewPoint[] }) {
  const chartPoints = points.map((point) => ({
    date: point.date,
    label: point.label,
    values: { views: point.views },
  }));
  const hasDailyViews = points.some((point) => point.views !== null);

  return (
    <section className="rounded-card border border-mist bg-paper px-5 py-4" aria-labelledby="reel-views-evolution-title">
      <header className="border-b border-mist pb-4">
        <h2 id="reel-views-evolution-title" className="flex items-center gap-2 text-[15px] font-semibold text-ink">
          <TrendingUp aria-hidden="true" className="size-4 text-ink" strokeWidth={1.7} />
          Evolución de visualizaciones
        </h2>
        <p className="font-support mt-1 text-[13px] text-graphite">
          Visualizaciones nuevas por día desde que Zenovi empezó a medir esta pieza.
        </p>
      </header>

      <div className="pt-4">
        {hasDailyViews ? (
          <DailyChart
            label="Visualizaciones nuevas por día"
            mode="line"
            series={[{ key: "views", label: "Visualizaciones", color: "var(--color-series-1)" }]}
            points={chartPoints}
          />
        ) : (
          <div className="font-support flex min-h-36 items-center justify-center rounded-control bg-canvas px-6 text-center text-[13px] leading-5 text-graphite">
            {points.length === 0
              ? "La medición empieza con la próxima sincronización."
              : "Ya guardamos el primer punto. Después de la próxima medición diaria podremos mostrar la evolución."}
          </div>
        )}
      </div>
    </section>
  );
}
