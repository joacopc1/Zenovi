import { TrendingUp } from "lucide-react";
import { DailyChart } from "@/components/analytics/daily-chart";
import {
  hasChartableViewEvolution,
  type MediaViewEvolution,
} from "@/lib/content/media-view-evolution";

/**
 * Cómo viene sumando visualizaciones la pieza.
 *
 * Una pieza deja de sumar a los pocos días de publicada, y a partir de ahí la curva es una
 * línea de ceros: cierta, muda y encima con aspecto de fracaso, cuando esa misma pieza
 * pudo haber tenido miles de visualizaciones. Por eso el gráfico aparece sólo mientras
 * haya movimiento; cuando se apagó, se cuenta en una frase con el número final, que es la
 * información que quedaba tapada.
 */
export function ReelViewsEvolution({ evolution }: { evolution: MediaViewEvolution }) {
  // Los snapshots acumulados se conservan para detectar que una pieza se frenó, pero
  // la curva sólo dibuja días en los que efectivamente sumó views. Una cola de ceros
  // ocupa espacio y se lee como caída aunque el Reel simplemente haya terminado su ciclo.
  const chartPoints = evolution.points.flatMap((point) =>
    point.views !== null && point.views > 0
      ? [{ date: point.date, label: point.label, values: { views: point.views } }]
      : [],
  );

  if (!hasChartableViewEvolution(evolution)) return null;

  return (
    <section
      className="h-full rounded-card border border-mist bg-paper px-5 py-4"
      aria-labelledby="reel-views-evolution-title"
    >
      <header className="border-b border-mist pb-4">
        <h2
          id="reel-views-evolution-title"
          className="flex items-center gap-2 text-[15px] font-semibold text-ink"
        >
          <TrendingUp aria-hidden="true" className="size-4 text-ink" strokeWidth={1.7} />
          Evolución de visualizaciones
        </h2>
      </header>

      <div className="pt-4">
        <DailyChart
          label="Visualizaciones nuevas por día"
          mode="line"
          series={[{ key: "views", label: "Visualizaciones", color: "var(--color-series-1)" }]}
          points={chartPoints}
        />
      </div>
    </section>
  );
}
