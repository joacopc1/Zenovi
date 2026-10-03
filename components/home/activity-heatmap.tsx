import { CardTitle } from "@/components/analytics/report-blocks";
import { HoverLabel } from "@/components/ui/hover-label";
import type { ActivityDay } from "@/lib/home/home-model";

const LEVELS = ["bg-ink/[0.06]", "bg-ink/25", "bg-ink/45", "bg-ink/70", "bg-ink"];
const WEEKDAY_LABELS = ["", "Lun", "", "Mié", "", "Vie", ""];

/**
 * Tu constancia: qué días publicaste en los últimos meses, como el "Activity" de Efferd y el
 * calendario de GitHub. Un cuadrado por día, más oscuro cuanto más publicaste; al pasar el
 * mouse dice cuánto y cuándo.
 */
export function ActivityHeatmap({
  grid,
  activeDays,
  total,
  max,
}: {
  grid: Array<Array<ActivityDay | null>>;
  activeDays: number;
  total: number;
  max: number;
}) {
  const months = monthMarks(grid);
  return (
    <section className="flex h-full flex-col rounded-card border border-mist bg-paper p-5">
      <CardTitle
        title="Tu constancia"
        trailing={
          <span className="text-[12px] text-graphite">
            <span className="font-numeric font-semibold text-ink">{activeDays}</span> {activeDays === 1 ? "día" : "días"} con publicación ·{" "}
            <span className="font-numeric font-semibold text-ink">{total}</span> {total === 1 ? "pieza" : "piezas"}
          </span>
        }
      />
      {/* Las columnas reparten el ancho de la card y cada día es un cuadrado: el calendario
          entra entero a cualquier ancho, sin scroll. */}
      <div className="mt-5 flex-1">
        <div className="grid gap-x-[3px] gap-y-1.5" style={{ gridTemplateColumns: `1.75rem repeat(${grid.length}, minmax(0, 1fr))` }}>
          <span aria-hidden="true" />
          {months.map((label, index) => (
            <span key={index} className="overflow-visible whitespace-nowrap text-[11px] leading-none text-muted">{label}</span>
          ))}
        </div>
        <div
          className="mt-1.5 grid grid-flow-col grid-rows-7 gap-[3px]"
          style={{ gridTemplateColumns: `1.75rem repeat(${grid.length}, minmax(0, 1fr))` }}
        >
          {WEEKDAY_LABELS.map((label, index) => (
            <span key={`label-${index}`} className="flex items-center text-[10px] leading-none text-muted">{label}</span>
          ))}
          {grid.flatMap((week, weekIndex) =>
            week.map((day, weekday) =>
              day === null ? (
                <span key={`${weekIndex}-${weekday}`} className="aspect-square" aria-hidden="true" />
              ) : (
                <span
                  key={day.date}
                  tabIndex={0}
                  aria-label={`${day.count} ${day.count === 1 ? "pieza" : "piezas"} el ${longDate(day.date)}`}
                  className={`group/tip relative aspect-square rounded-[3px] outline-none focus-visible:ring-2 focus-visible:ring-ink/30 ${LEVELS[level(day.count, max)]}`}
                >
                  <HoverLabel>
                    {day.count === 0 ? "Sin publicar" : `${day.count} ${day.count === 1 ? "pieza" : "piezas"}`} · {longDate(day.date)}
                  </HoverLabel>
                </span>
              ),
            ),
          )}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-end gap-1.5 text-[11px] text-muted">
        Menos
        {LEVELS.map((className) => (
          <span key={className} className={`size-3 rounded-[3px] ${className}`} aria-hidden="true" />
        ))}
        Más
      </div>
    </section>
  );
}

/** Cuatro tonos además del vacío, repartidos según el día con más publicaciones. */
function level(count: number, max: number) {
  if (count === 0) return 0;
  return Math.min(4, Math.max(1, Math.ceil((count / max) * 4)));
}

/**
 * El mes arriba de la primera semana en la que empieza. Si dos meses caen a menos de tres
 * columnas (la primera semana suele ser del mes anterior), queda sólo el segundo.
 */
function monthMarks(grid: Array<Array<ActivityDay | null>>) {
  const marks = rawMonthMarks(grid);
  return marks.map((label, index) => (label && marks.slice(index + 1, index + 3).some(Boolean) ? "" : label));
}

function rawMonthMarks(grid: Array<Array<ActivityDay | null>>) {
  let previous = "";
  return grid.map((week) => {
    const first = week.find((day) => day !== null);
    if (!first) return "";
    const month = new Intl.DateTimeFormat("es-UY", { month: "short", timeZone: "UTC" }).format(new Date(`${first.date}T12:00:00Z`)).replace(".", "");
    if (month === previous) return "";
    previous = month;
    return month.charAt(0).toUpperCase() + month.slice(1);
  });
}

function longDate(isoDate: string) {
  return new Intl.DateTimeFormat("es-UY", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${isoDate}T12:00:00Z`));
}
