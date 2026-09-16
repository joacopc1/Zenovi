import { CalendarDays, TrendingUp, Users } from "lucide-react";
import { RadarChart } from "@/components/ui/radar-chart";
import type { ReportModel } from "@/lib/analytics/report-model";
import { formatDecimal, formatNumber } from "@/lib/format/numbers";
import { DailyChart } from "../daily-chart";
import { ReportCard, StatChips } from "../report-blocks";
import { signed, toPoints } from "../report-view";

export function CommunitySection({ model }: { model: ReportModel }) {
  const { followers, strongest, weekdays } = model;

  return (
    // La evolución necesita más ancho que el radar, que se lee bien en poco espacio.
    <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <ReportCard title="Seguidores">
        <DailyChart
          label="Seguidores por día"
          mode="line"
          series={[{ key: "followers", label: "Seguidores", color: "var(--color-series-1)" }]}
          points={toPoints(model.series.slice(-model.days), ["followers"])}
        />
        <div className="mt-4">
          <StatChips
            items={[
              {
                label: "Cambio en el período",
                value: followers ? signed(followers.change, formatNumber) : "—",
                icon: <TrendingUp size={13} strokeWidth={1.75} />,
                tone:
                  followers && followers.change > 0
                    ? "up"
                    : followers && followers.change < 0
                      ? "down"
                      : "neutral",
              },
              {
                label: "Promedio por día",
                value: followers?.perDay != null ? signed(followers.perDay, formatDecimal) : "—",
                icon: <CalendarDays size={13} strokeWidth={1.75} />,
              },
              {
                label: "Total actual",
                value: formatNumber(model.followersTotal),
                icon: <Users size={13} strokeWidth={1.75} />,
              },
            ]}
          />
        </div>
      </ReportCard>

      <ReportCard title="Días con más interacción">
        {weekdays.every((entry) => entry.average !== null) ? (
          <RadarChart
            config={{ interactions: { label: "Interacciones" } }}
            data={weekdays.map((entry) => ({
              weekday: entry.weekday,
              interactions: Math.round((entry.average ?? 0) * 10) / 10,
            }))}
            dataKey="weekday"
            series={[{ dataKey: "interactions", name: "Interacciones promedio" }]}
            colors={["var(--color-series-1)"]}
            containerHeight={260}
          />
        ) : (
          // Un día sin datos dibujado en cero deformaría la figura: mejor no dibujarla.
          <p className="flex h-[260px] items-center justify-center rounded-control bg-canvas px-6 text-center text-xs leading-5 text-muted">
            Todavía no hay datos de todos los días de la semana en el período.
          </p>
        )}
        <p className="mt-4 text-xs leading-5 text-muted">
          {strongest
            ? `Los ${weekdayName(strongest.weekday)} recibís en promedio ${formatDecimal(strongest.average)} interacciones. Mide cuándo interactúan con vos, no qué día conviene publicar.`
            : "Hacen falta al menos dos semanas de datos de cada día para señalar uno."}
        </p>
      </ReportCard>
    </div>
  );
}

function weekdayName(short: string) {
  const names: Record<string, string> = {
    Lun: "lunes",
    Mar: "martes",
    Mié: "miércoles",
    Jue: "jueves",
    Vie: "viernes",
    Sáb: "sábados",
    Dom: "domingos",
  };
  return names[short] ?? short;
}
