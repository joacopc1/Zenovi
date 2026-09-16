import Link from "next/link";
import type { ReactNode } from "react";
import { buildAnalyticsHref, type AnalyticsTab, type RangeDays } from "@/lib/analytics/range";

/**
 * Pestañas del informe (21st.dev, "Tabs" animadas de @Hextaui).
 *
 * Dos adaptaciones, las dos por el mismo motivo: acá la pestaña elegida vive en la URL,
 * junto con el período de 7, 30 o 90 días. Por eso cada pestaña es un enlace y no un
 * botón con estado interno —si no, cambiar de período devolvería siempre a la primera—
 * y por eso el indicador que se desliza no mide el DOM: todas las columnas miden igual,
 * así que su posición sale de una cuenta en CSS y el deslizamiento de una transición,
 * sin traer `motion` sólo para esto.
 */
export type TabDescriptor = { id: AnalyticsTab; label: string; icon: ReactNode };

export function AnalyticsTabs({
  tabs,
  active,
  days,
}: {
  tabs: TabDescriptor[];
  active: AnalyticsTab;
  days: RangeDays;
}) {
  const activeIndex = Math.max(
    tabs.findIndex((tab) => tab.id === active),
    0,
  );
  // El riel tiene 4px de aire a cada lado: el ancho útil es el total menos 8px.
  const track = "(100% - 0.5rem)";

  return (
    <nav
      aria-label="Secciones del informe"
      className="relative inline-grid w-fit max-w-full auto-cols-fr grid-flow-col rounded-control border border-mist bg-paper p-1"
    >
      <span
        aria-hidden="true"
        className="absolute bottom-1 top-1 z-0 rounded-[7px] bg-control transition-[left] duration-300 ease-out motion-reduce:transition-none"
        style={{
          left: `calc(0.25rem + ${activeIndex} * ${track} / ${tabs.length})`,
          width: `calc(${track} / ${tabs.length})`,
        }}
      />

      {tabs.map((tab) => {
        const selected = tab.id === active;

        return (
          <Link
            key={tab.id}
            href={buildAnalyticsHref("/analytics", days, tab.id)}
            aria-current={selected ? "page" : undefined}
            className={`relative z-10 flex h-7 items-center justify-center gap-1.5 whitespace-nowrap px-3 text-[13px] font-medium transition-colors ${
              selected ? "text-ink" : "text-graphite hover:text-ink"
            }`}
          >
            <span aria-hidden="true" className="flex">
              {tab.icon}
            </span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
