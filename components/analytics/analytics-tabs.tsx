import Link from "next/link";
import type { ReactNode } from "react";
import { buildAnalyticsHref, type AnalyticsTab, type RangeDays } from "@/lib/analytics/range";

export type TabDescriptor = { id: AnalyticsTab; label: string; icon: ReactNode };

/**
 * Pestañas del informe con subrayado, como las de ADN de marca: la activa lleva la
 * línea y el texto negros, el resto queda en grafito. Cada pestaña es un enlace porque
 * la pestaña y el período viven en la URL.
 */
export function AnalyticsTabs({
  tabs,
  active,
  days,
}: {
  tabs: TabDescriptor[];
  active: AnalyticsTab;
  days: RangeDays;
}) {
  return (
    <nav
      aria-label="Secciones del informe"
      className="-mb-px flex gap-6 overflow-x-auto border-b border-mist"
    >
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={buildAnalyticsHref("/analytics", days, tab.id)}
            aria-current={selected ? "page" : undefined}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 pb-2.5 text-[13px] font-medium transition-colors ${
              selected ? "border-ink text-ink" : "border-transparent text-graphite hover:text-ink"
            }`}
          >
            <span aria-hidden="true" className="flex">{tab.icon}</span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
