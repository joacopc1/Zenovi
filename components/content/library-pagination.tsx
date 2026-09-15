import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildContentUrl, type ContentUrlState } from "@/lib/content/pagination";

/**
 * "Mostrando 25–48 de 100" con flechas y números de página. Cada página es un enlace real:
 * se puede compartir, abrir en otra pestaña y volver con el botón atrás.
 */
export function LibraryPagination({
  state,
  page,
  totalPages,
  from,
  to,
  total,
}: {
  state: Omit<ContentUrlState, "page">;
  page: number;
  totalPages: number;
  from: number;
  to: number;
  total: number;
}) {
  if (total === 0) return null;

  const href = (target: number) => buildContentUrl({ ...state, page: target });

  return (
    <nav aria-label="Páginas de la biblioteca" className="mt-6 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-muted">
        Mostrando <span className="tabular-nums text-graphite">{from}–{to}</span> de{" "}
        <span className="tabular-nums text-graphite">{total}</span>
      </p>

      {totalPages > 1 ? (
        <div className="flex items-center gap-1">
          <PageArrow href={page > 1 ? href(page - 1) : null} label="Página anterior">
            <ChevronLeft size={16} strokeWidth={1.75} aria-hidden />
          </PageArrow>

          {Array.from({ length: totalPages }, (_, index) => index + 1).map((target) => (
            <Link
              key={target}
              href={href(target)}
              aria-current={target === page ? "page" : undefined}
              className={`grid size-8 place-items-center rounded-control text-xs tabular-nums transition-colors ${
                target === page ? "bg-ink/[0.065] font-medium text-ink" : "text-graphite hover:bg-canvas hover:text-ink"
              }`}
            >
              {target}
            </Link>
          ))}

          <PageArrow href={page < totalPages ? href(page + 1) : null} label="Página siguiente">
            <ChevronRight size={16} strokeWidth={1.75} aria-hidden />
          </PageArrow>
        </div>
      ) : null}
    </nav>
  );
}

function PageArrow({ href, label, children }: { href: string | null; label: string; children: React.ReactNode }) {
  const className = "grid size-8 place-items-center rounded-control border border-mist bg-paper";

  return href ? (
    <Link href={href} aria-label={label} className={`${className} text-graphite hover:border-mist-strong hover:text-ink`}>
      {children}
    </Link>
  ) : (
    <span aria-hidden="true" className={`${className} text-mist-strong`}>
      {children}
    </span>
  );
}
