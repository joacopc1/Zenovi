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
 * lee como lista y no como tarjetas: ya no hay nada que hacer con estas piezas, sólo
 * mirarlas, y una lista entra diez veces en el mismo espacio.
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
    <section className="mt-8">
      <div className="flex items-baseline gap-2 border-b border-mist pb-2.5">
        <h2 className="text-[13px] font-semibold text-ink">Historial</h2>
        <p className="font-support text-[11px] text-muted">
          Lo que salió hace más de {RECENTLY_PUBLISHED_DAYS} días · {items.length}
        </p>
      </div>

      <ul>
        {items.map((item) => {
          const performance = links.performance[item.id] ?? null;

          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onOpen(item.id)}
                className="flex w-full items-center gap-3 border-b border-mist px-1 py-2.5 text-left transition-colors hover:bg-canvas"
              >
                <span className="font-numeric w-14 shrink-0 text-[12px] text-muted">
                  {item.publishedAt ? dateFormatter.format(new Date(item.publishedAt)) : "—"}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">
                  {contentItemName(item)}
                </span>
                <span className="font-support hidden shrink-0 text-[11px] text-muted sm:block">
                  {FORMAT_LABELS[item.format]}
                </span>
                {performance ? (
                  <PerformanceBadge multiplier={performance.multiplier} className="shrink-0" />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
