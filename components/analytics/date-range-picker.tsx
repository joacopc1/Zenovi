"use client";

import Link from "next/link";
import { useDismissibleDetails } from "@/components/shell/use-dismissible-details";
import {
  RANGE_OPTIONS,
  buildAnalyticsHref,
  buildRangeHref,
  type AnalyticsTab,
  type RangeDays,
} from "@/lib/analytics/range";

export function DateRangePicker({
  basePath,
  selected,
  tab,
}: {
  basePath: string;
  selected: RangeDays;
  /** Cambiar de período no debe cerrar la sección que la persona estaba mirando. */
  tab?: AnalyticsTab;
}) {
  const detailsRef = useDismissibleDetails();

  return (
    <details ref={detailsRef} className="relative">
      <summary
        aria-label={`Período de análisis: últimos ${selected} días`}
        className="flex min-h-8 cursor-pointer list-none items-center gap-1.5 rounded-control border border-mist bg-paper px-3 text-xs font-medium text-graphite hover:border-mist-strong hover:text-ink [&::-webkit-details-marker]:hidden"
      >
        <CalendarIcon className="size-3.5" />
        Últimos {selected} días
        <ChevronIcon className="size-3" />
      </summary>

      <div className="absolute right-0 top-full z-50 mt-1.5 w-44 rounded-card border border-mist bg-paper p-1 shadow-[0_12px_32px_rgba(0,0,0,0.10)]">
        {RANGE_OPTIONS.map((days) => (
          <Link
            key={days}
            href={tab ? buildAnalyticsHref(basePath, days, tab) : buildRangeHref(basePath, days)}
            aria-current={days === selected ? "true" : undefined}
            className={`flex min-h-8 items-center rounded-control px-2.5 text-[13px] transition-colors ${
              days === selected
                ? "bg-ink/[0.065] text-ink"
                : "text-graphite hover:bg-canvas hover:text-ink"
            }`}
          >
            Últimos {days} días
          </Link>
        ))}
      </div>
    </details>
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

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m6 9.5 6 5.5 6-5.5" />
    </svg>
  );
}
