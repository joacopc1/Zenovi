"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { FORMAT_LABELS, STATUS_LABELS, type ContentFormat, type ContentStatus } from "@/lib/production/content";

export type AgendaItem = { id: string; title: string; status: ContentStatus; format: ContentFormat; targetDate: string };

/**
 * Los próximos siete días de Producción como la agenda del Dashboard 12 de Efferd: los días
 * arriba (el nombre sobre el número, una línea bajo el elegido, un punto si hay algo
 * planeado) y, debajo, las tarjetas de ese día. Arranca en hoy: lo que importa es qué viene.
 */
export function WeekAgenda({ days, today, items }: { days: string[]; today: string; items: AgendaItem[] }) {
  const [selected, setSelected] = useState(today);
  const dayItems = items.filter((item) => item.targetDate === selected);

  return (
    <section className="flex h-full flex-col rounded-card border border-mist bg-paper">
      <div className="grid grid-cols-7 border-b border-mist px-3" role="tablist" aria-label="Días de esta semana">
        {days.map((day) => {
          const date = parseDay(day);
          const active = day === selected;
          const planned = items.some((item) => item.targetDate === day);
          return (
            <button
              key={day}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSelected(day)}
              className="relative flex flex-col items-center gap-1 pb-3 pt-4"
            >
              <span className={`text-[12px] ${active ? "font-semibold text-ink" : "text-muted"}`}>{day === today ? "Hoy" : weekday(date)}</span>
              <span className={`font-numeric text-[15px] ${active ? "font-bold text-ink" : day === today ? "font-semibold text-ink" : "text-graphite"}`}>
                {date.getDate()}
              </span>
              {/* El punto de "hay algo planeado" se queda aunque el día esté elegido. */}
              {planned ? <span className={`absolute bottom-1.5 size-1 rounded-full ${active ? "bg-ink" : "bg-graphite"}`} aria-hidden="true" /> : null}
              {active ? <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-ink" aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>

      <div className="flex flex-1 flex-col p-4" role="tabpanel">
        {dayItems.length === 0 ? (
          <EmptyState
            illustration="calendar"
            title={selected === today ? "Nada planeado para hoy" : "Nada planeado este día"}
            description="Poné fecha a una idea de Producción y aparece acá."
          />
        ) : (
          <ul className="space-y-2.5">
            {dayItems.map((item) => (
              <li key={item.id} className="rounded-xl border border-mist p-3.5">
                <p className="text-[14px] font-semibold leading-5 text-ink">{item.title || "Sin título"}</p>
                <p className="mt-0.5 text-[12px] text-graphite">
                  {FORMAT_LABELS[item.format]} · {STATUS_LABELS[item.status]}
                </p>
                <div className="mt-3 flex justify-end">
                  <Link
                    href={`/production?item=${encodeURIComponent(item.id)}`}
                    className="inline-flex items-center gap-0.5 rounded-control border border-mist px-2.5 py-1 text-[12px] font-medium text-ink hover:bg-canvas"
                  >
                    Abrir
                    <ChevronRight aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link href="/production" className="flex items-center justify-center gap-1 border-t border-mist py-3 text-[13px] font-medium text-ink hover:bg-ink/[0.02]">
        Ver en Producción
        <ArrowRight aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
      </Link>
    </section>
  );
}

function parseDay(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function weekday(date: Date) {
  const name = new Intl.DateTimeFormat("es-UY", { weekday: "short" }).format(date).replace(".", "");
  return name.charAt(0).toUpperCase() + name.slice(1);
}
