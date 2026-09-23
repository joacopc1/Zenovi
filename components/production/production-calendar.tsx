"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ContentItem } from "@/lib/data/production";
import {
  CALENDAR_WEEKDAYS,
  buildMonthGrid,
  monthTitle,
  todayISODate,
  toISODate,
} from "@/lib/production/calendar";

export function ProductionCalendar({
  items,
  onOpen,
}: {
  items: ContentItem[];
  onOpen: (id: string) => void;
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const days = buildMonthGrid(year, month);
  const itemsByDate = new Map<string, ContentItem[]>();

  for (const item of items) {
    if (!item.targetDate) continue;
    const list = itemsByDate.get(item.targetDate) ?? [];
    list.push(item);
    itemsByDate.set(item.targetDate, list);
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

      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          if (day === null) return <div key={`empty-${index}`} />;

          const iso = toISODate(year, month, day);
          const dayItems = itemsByDate.get(iso) ?? [];
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
                {dayItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onOpen(item.id)}
                    className="block w-full truncate rounded-control bg-canvas px-2 py-1 text-left text-[11px] font-medium text-ink transition-colors hover:bg-control"
                    title={item.title}
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
