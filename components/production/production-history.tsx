"use client";

import { PerformanceBadge } from "@/components/content/performance-badge";
import { FORMAT_LABELS, RECENTLY_PUBLISHED_DAYS, contentItemName } from "@/lib/production/content";
import type { ContentItem } from "@/lib/data/production";
import type { ProductionLinks } from "@/lib/data/production-links";

const dateFormatter = new Intl.DateTimeFormat("es-UY", { day: "numeric", month: "short" });

/**
 * Lo que salió hace más de dos semanas, debajo del tablero.
 *
 * El pipeline es para ver en qué anda la producción; una columna que guarda todo lo
 * publicado desde siempre deja de servir para eso a los seis meses. Acá el historial se
 * lee como tabla y no como tarjetas sueltas: ya no hay nada que hacer con estas piezas,
 * sólo mirarlas y compararlas, y para comparar las columnas tienen que estar alineadas.
 */
export function ProductionHistory({
  items,
  links,
  onOpen,
}: {
  items: ContentItem[];
  links: ProductionLinks;
  onOpen: (id: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <section className="mt-8 overflow-hidden rounded-card border border-mist bg-paper">
      <header className="flex items-baseline justify-between gap-3 border-b border-mist px-4 py-3">
        <h2 className="text-[13px] font-semibold text-ink">Historial</h2>
        <p className="font-support text-[11px] text-muted">
          Salió hace más de {RECENTLY_PUBLISHED_DAYS} días · {items.length}
        </p>
      </header>

      <ul>
        {items.map((item) => {
          const performance = links.performance[item.id] ?? null;

          return (
            <li key={item.id} className="border-b border-mist last:border-b-0">
              <button
                type="button"
                onClick={() => onOpen(item.id)}
                className="flex w-full items-center gap-4 px-4 py-2.5 text-left transition-colors hover:bg-canvas"
              >
                <span className="font-numeric w-14 shrink-0 text-[12px] text-muted">
                  {item.publishedAt ? dateFormatter.format(new Date(item.publishedAt)) : "—"}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">
                  {contentItemName(item)}
                </span>
                <span className="font-support hidden w-20 shrink-0 text-[11px] text-muted sm:block">
                  {FORMAT_LABELS[item.format]}
                </span>
                {/* Ancho fijo aunque no haya multiplicador: si la columna se corriera pieza
                    por pieza no se podrían comparar de un vistazo, que es para lo que está. */}
                <span className="flex w-16 shrink-0 justify-end">
                  <PerformanceBadge multiplier={performance?.multiplier ?? null} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
