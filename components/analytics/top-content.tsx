import Image from "next/image";
import Link from "next/link";
import type { RankedContentItem } from "@/lib/content/library";
import { formatCompact, formatDecimal } from "@/lib/format/numbers";

const columns = [
  { key: "views", label: "Visualizaciones" },
  { key: "likes", label: "Me gusta" },
  { key: "comments", label: "Comentarios" },
  { key: "saves", label: "Guardados" },
  { key: "shares", label: "Compartidos" },
] as const;

/**
 * Las piezas publicadas en el período, ordenadas por visualizaciones. Cada fila abre la
 * pieza: la portada y el título son el enlace, porque es lo que uno reconoce de un vistazo.
 */
export function TopContent({ items }: { items: RankedContentItem[] }) {
  if (items.length === 0) {
    return (
      <p className="font-support rounded-card border border-mist bg-canvas px-6 py-10 text-center text-xs leading-5 text-muted">
        No hay piezas publicadas en este período con visualizaciones informadas.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-card border border-mist bg-paper">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="font-support text-[11px] text-muted">
            <th className="px-5 py-3 font-medium">Pieza</th>
            {columns.map((column) => (
              <th key={column.key} className="px-3 py-3 text-right font-medium">
                {column.label}
              </th>
            ))}
            <th className="px-5 py-3 text-right font-medium">Rendimiento</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t border-mist align-middle">
              <td className="px-5 py-3">
                <Link href={detailHref(item)} className="group flex items-center gap-3">
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-[10px] bg-canvas">
                    {item.thumbnailUrl ? (
                      <Image
                        src={item.thumbnailUrl}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                      />
                    ) : null}
                  </span>
                  <span className="min-w-0">
                    <span className="font-support block text-[11px] uppercase tracking-[0.04em] text-muted">
                      {item.formatLabel}
                    </span>
                    <span className="mt-0.5 line-clamp-1 block max-w-[280px] text-[13px] font-medium text-ink">
                      {item.caption?.trim() || "Sin texto"}
                    </span>
                    <span className="font-support mt-0.5 block text-[11px] text-muted">{item.dateLabel}</span>
                  </span>
                </Link>
              </td>

              {columns.map((column) => (
                <td key={column.key} className="font-numeric px-3 py-3 text-right text-[13px] tabular-nums">
                  {formatCompact(item[column.key])}
                </td>
              ))}

              <td className={`font-numeric px-5 py-3 text-right text-[13px] font-medium tabular-nums ${toneClass(item.multiplier)}`}>
                {item.multiplier === null ? "—" : `×${formatDecimal(item.multiplier)}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function detailHref(item: RankedContentItem) {
  return item.kind === "reel" ? `/content/${item.id}` : `/content/${item.id}?type=${item.kind}`;
}

/** Misma banda que el badge de la biblioteca: fuera de ±20 % deja de ser ruido. */
function toneClass(multiplier: number | null) {
  if (multiplier === null) return "text-muted";
  if (multiplier >= 1.2) return "text-success";
  if (multiplier <= 0.8) return "text-danger";
  return "text-ink";
}
