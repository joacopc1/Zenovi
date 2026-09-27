import { TrendingUp } from "lucide-react";
import { DailyChart } from "@/components/analytics/daily-chart";
import { formatCompact } from "@/lib/format/numbers";
import type { MediaViewEvolution } from "@/lib/content/media-view-evolution";

const dateFormatter = new Intl.DateTimeFormat("es-UY", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

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
  const chartPoints = evolution.points.map((point) => ({
    date: point.date,
    label: point.label,
    values: { views: point.views },
  }));

  return (
    <section
      className="rounded-card border border-mist bg-paper px-5 py-4"
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
        <p className="font-support mt-1 text-[13px] text-graphite">
          Visualizaciones nuevas por día desde que Zenovi empezó a medir esta pieza.
        </p>
      </header>

      <div className="pt-4">
        {evolution.growing ? (
          <DailyChart
            label="Visualizaciones nuevas por día"
            mode="line"
            series={[{ key: "views", label: "Visualizaciones", color: "var(--color-series-1)" }]}
            points={chartPoints}
          />
        ) : (
          <Quieta evolution={evolution} />
        )}
      </div>
    </section>
  );
}

/** Lo que hay para decir cuando no hay curva que dibujar. */
function Quieta({ evolution }: { evolution: MediaViewEvolution }) {
  const { total, flatDays, lastGrowthOn, points } = evolution;

  return (
    <div className="font-support flex min-h-36 flex-col items-center justify-center gap-1 rounded-control bg-canvas px-6 text-center">
      {points.length === 0 ? (
        <p className="text-[13px] leading-5 text-graphite">
          La medición empieza con la próxima sincronización.
        </p>
      ) : flatDays === 0 ? (
        <p className="text-[13px] leading-5 text-graphite">
          Ya guardamos el primer punto. Después de la próxima medición diaria podremos
          mostrar la evolución.
        </p>
      ) : (
        <>
          <p className="text-[15px] font-semibold text-ink">
            Esta pieza ya no suma visualizaciones
          </p>
          <p className="text-[13px] leading-5 text-graphite">
            {flatDays === 1 ? "Hace un día" : `Hace ${flatDays} días`} que no se mueve
            {total === null ? "" : `, y quedó en ${formatCompact(total)}`}.
            {lastGrowthOn
              ? ` La última vez que creció fue el ${dateFormatter.format(new Date(`${lastGrowthOn}T00:00:00Z`))}.`
              : ""}
          </p>
        </>
      )}
    </div>
  );
}
