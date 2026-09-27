"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  CONTENT_PIPELINE,
  FORMAT_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  contentItemName,
} from "@/lib/production/content";
import type { ContentItem } from "@/lib/data/production";
import {
  CALENDAR_WEEKDAYS,
  buildMonthGrid,
  calendarDateOf,
  isoDateOf,
  monthTitle,
  todayISODate,
  toISODate,
} from "@/lib/production/calendar";
import type { PublishedPiece } from "@/lib/production/reconcile";

/**
 * El calendario de producción: lo que viene y lo que ya salió, en la misma grilla.
 *
 * Muestra las publicaciones reales de Instagram y no sólo las piezas del tablero, porque
 * si no contestaba mal la pregunta más obvia que se le hace a un calendario —"¿qué subí
 * y cuándo?"—: lo que el creador publicó sin anotarlo en Zenovi simplemente no existía.
 * Las que sí están en el tablero se ubican por el día en que salieron, no por el día en
 * que se habían planificado.
 */
export function ProductionCalendar({
  items,
  published,
  claimed,
  onOpen,
}: {
  items: ContentItem[];
  published: PublishedPiece[];
  /** Publicaciones que ya tiene alguna pieza del tablero, filtrada o no. */
  claimed: ReadonlySet<string>;
  onOpen: (id: string) => void;
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const days = buildMonthGrid(year, month);
  const itemsByDate = new Map<string, ContentItem[]>();

  for (const item of items) {
    const date = calendarDateOf(item);
    if (!date) continue;
    const list = itemsByDate.get(date) ?? [];
    list.push(item);
    itemsByDate.set(date, list);
  }

  // Las publicaciones que ya reclamó una pieza del tablero no se repiten: esa pieza ya
  // está en la grilla, con su nombre y su estado, que dice más que la publicación suelta.
  const publishedByDate = new Map<string, PublishedPiece[]>();

  for (const piece of published) {
    if (claimed.has(piece.id)) continue;
    const date = isoDateOf(new Date(piece.postedAt));
    const list = publishedByDate.get(date) ?? [];
    list.push(piece);
    publishedByDate.set(date, list);
  }

  function shift(delta: number) {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  }

  const todayKey = todayISODate();

  return (
    <div className="overflow-hidden rounded-card border border-mist">
      <header className="flex items-center justify-between border-b border-mist px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">{monthTitle(year, month)}</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shift(-1)}
            className="grid size-7 place-items-center rounded-control text-graphite transition-colors hover:text-ink"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={15} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              setYear(now.getFullYear());
              setMonth(now.getMonth());
            }}
            className="h-7 rounded-control px-2.5 text-[12px] font-medium text-graphite transition-colors hover:text-ink"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => shift(1)}
            className="grid size-7 place-items-center rounded-control text-graphite transition-colors hover:text-ink"
            aria-label="Mes siguiente"
          >
            <ChevronRight size={15} strokeWidth={1.75} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-7 border-b border-mist">
        {CALENDAR_WEEKDAYS.map((day) => (
          <div key={day} className="py-2 text-center text-[11px] font-medium text-muted">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 border-b border-mist">
        {days.map((day, index) => {
          if (day === null) return <div key={`empty-${index}`} />;

          const iso = toISODate(year, month, day);
          const dayItems = itemsByDate.get(iso) ?? [];
          const dayPublished = publishedByDate.get(iso) ?? [];
          const isToday = iso === todayKey;

          return (
            <div
              key={iso}
              className="min-h-[96px] border-b border-r border-mist p-1.5 transition-colors last:border-r-0"
            >
              <span
                className={`font-numeric inline-flex size-6 items-center justify-center rounded-full text-[12px] ${
                  isToday ? "bg-ink font-semibold text-paper" : "text-ink"
                }`}
              >
                {day}
              </span>

              <div className="mt-1 space-y-1">
                {dayItems.map((item) => {
                  const published = item.status === "publicada";

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onOpen(item.id)}
                      className={`flex w-full items-center gap-1.5 rounded-control px-2 py-1 text-left text-[11px] font-medium transition-colors ${
                        // Lo publicado ya salió: se lee, pero no compite con lo que falta hacer.
                        published
                          ? "bg-transparent text-muted hover:bg-canvas"
                          : "bg-canvas text-ink hover:bg-control"
                      }`}
                      title={`${contentItemName(item)} · ${STATUS_LABELS[item.status]}`}
                    >
                      <span
                        aria-hidden="true"
                        className="size-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[item.status] }}
                      />
                      <span className="truncate">{contentItemName(item)}</span>
                    </button>
                  );
                })}

                {dayPublished.map((piece) => (
                  <span
                    key={piece.id}
                    title={`${FORMAT_LABELS[piece.kind]} publicado, sin registrar en el tablero`}
                    className="flex w-full items-center gap-1.5 rounded-control border border-dashed border-mist px-2 py-1 text-left text-[11px] font-medium text-muted"
                  >
                    <span
                      aria-hidden="true"
                      className="size-1.5 shrink-0 rounded-full border border-muted"
                    />
                    <span className="truncate">{FORMAT_LABELS[piece.kind]}</span>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-3 py-2.5">
        {CONTENT_PIPELINE.map((status) => (
          <li key={status} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="size-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[status] }}
            />
            <span className="font-support text-[11px] text-muted">{STATUS_LABELS[status]}</span>
          </li>
        ))}
        {published.length > 0 ? (
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="size-1.5 shrink-0 rounded-full border border-muted"
            />
            <span className="font-support text-[11px] text-muted">Publicado, sin registrar</span>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
