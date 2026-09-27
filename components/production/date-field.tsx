"use client";

import { useMemo, useState } from "react";
import { formatTargetDate, parseTargetDate } from "@/lib/production/content";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDismissibleDetails } from "@/components/shell/use-dismissible-details";
import {
  CALENDAR_MONTHS,
  CALENDAR_WEEKDAYS,
  buildMonthGrid,
  toISODate,
} from "@/lib/production/calendar";

export function DateField({
  value,
  onChange,
  compact = false,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  /** Versión chica, para acompañar a otro control en vez de ocupar un campo entero. */
  compact?: boolean;
}) {
  const detailsRef = useDismissibleDetails();
  const [viewDate, setViewDate] = useState(() => (value ? parseTargetDate(value) : new Date()));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const days = useMemo(() => buildMonthGrid(year, month), [year, month]);

  function select(day: number) {
    onChange(toISODate(year, month, day));
    detailsRef.current?.removeAttribute("open");
  }

  const label = value ? formatTargetDate(value) : compact ? "Sin fecha" : "Elegí una fecha";

  return (
    <details ref={detailsRef} className="relative">
      <summary
        aria-label={`Fecha objetivo: ${label}`}
        className={`flex w-full cursor-pointer list-none items-center gap-2 rounded-full border bg-paper [&::-webkit-details-marker]:hidden ${
          compact
            ? "font-support min-h-[26px] justify-start border-mist px-2.5 text-[11px] font-medium text-graphite transition-colors hover:border-mist-strong hover:text-ink"
            : "min-h-[38px] justify-between rounded-control border-mist-strong px-3 text-sm text-ink"
        }`}
      >
        <CalendarIcon className={compact ? "size-3 shrink-0" : "order-2 size-3.5 text-muted"} />
        <span className={value ? "" : "text-muted"}>{label}</span>
      </summary>

      <div
        className="absolute left-0 top-full z-50 mt-1.5 w-64 rounded-card border border-mist-strong bg-paper p-3"
      >
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setViewDate(new Date(year, month - 1, 1))}
            className="grid size-7 place-items-center rounded-control text-graphite transition-colors hover:text-ink"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={14} strokeWidth={1.75} />
          </button>
          <span className="text-[13px] font-medium text-ink">
            {CALENDAR_MONTHS[month]} {year}
          </span>
          <button
            type="button"
            onClick={() => setViewDate(new Date(year, month + 1, 1))}
            className="grid size-7 place-items-center rounded-control text-graphite transition-colors hover:text-ink"
            aria-label="Mes siguiente"
          >
            <ChevronRight size={14} strokeWidth={1.75} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {CALENDAR_WEEKDAYS.map((day) => (
            <span key={day} className="flex h-7 items-center justify-center text-[11px] font-medium text-muted">
              {day}
            </span>
          ))}
          {/* El selector muestra sólo el mes elegido: los días de al lado se verían
              elegibles y no lo son, porque elegirlos cambiaría de mes sin avisar. */}
          {days.map((cell) =>
            cell.inMonth ? (
              <DayButton
                key={cell.iso}
                day={cell.day}
                selected={value === cell.iso}
                onSelect={() => select(cell.day)}
              />
            ) : (
              <span key={cell.iso} />
            ),
          )}
        </div>

        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              detailsRef.current?.removeAttribute("open");
            }}
            className="mt-2 w-full rounded-control px-2 py-1.5 text-center text-[12px] font-medium text-graphite transition-colors hover:text-ink"
          >
            Quitar fecha
          </button>
        ) : null}
      </div>
    </details>
  );
}

function DayButton({ day, selected, onSelect }: { day: number; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex h-7 items-center justify-center rounded-control text-[12px] transition-colors ${
        selected
          ? "bg-ink font-semibold text-paper"
          : "text-ink hover:bg-canvas"
      }`}
    >
      {day}
    </button>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M7 3v4m10-4v4M3 10h18" />
    </svg>
  );
}
