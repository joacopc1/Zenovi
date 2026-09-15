"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type SVGProps } from "react";
import type {
  ContentKind,
  ContentSort,
  ContentSortDirection,
} from "@/lib/content/library";
import { buildContentUrl } from "@/lib/content/pagination";

type FilterState = {
  kind: ContentKind;
  sort: ContentSort;
  direction: ContentSortDirection;
  search: string;
};

const sortOptions: { value: ContentSort; label: string }[] = [
  { value: "recent", label: "Fecha" },
  { value: "views", label: "Visualizaciones" },
  { value: "reach", label: "Alcance" },
  { value: "interactions", label: "Interacciones" },
  { value: "likes", label: "Me gusta" },
  { value: "comments", label: "Comentarios" },
  { value: "saves", label: "Guardados" },
  { value: "shares", label: "Compartidos" },
  { value: "multiplier", label: "Multiplicador" },
];

export function ContentFilters({
  kind,
  search,
  sort,
  direction,
  resultCount,
}: {
  kind: ContentKind;
  search: string;
  sort: ContentSort;
  direction: ContentSortDirection;
  resultCount: number;
}) {
  const router = useRouter();
  const [draftSearch, setDraftSearch] = useState(search);

  // Un único punto de navegación: cada control describe sólo lo que cambia.
  const apply = useCallback(
    (changes: Partial<FilterState>) =>
      router.replace(buildContentUrl({ kind, sort, direction, search: draftSearch, ...changes })),
    [router, kind, sort, direction, draftSearch],
  );

  // El texto se aplica solo, con una pausa, para no navegar en cada tecla.
  // Mientras el borrador coincide con lo ya aplicado no hay nada que hacer,
  // así que el primer render y los cambios de orden no disparan navegación.
  useEffect(() => {
    if (draftSearch.trim() === search) return;

    const timeout = setTimeout(() => apply({}), 350);
    return () => clearTimeout(timeout);
  }, [draftSearch, search, apply]);

  const orderedByDate = sort === "recent";

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      <div className="relative min-w-0 flex-1 sm:max-w-xs">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <label className="sr-only" htmlFor="content-search">
          Buscar contenido por texto
        </label>
        <input
          id="content-search"
          type="search"
          value={draftSearch}
          onChange={(event) => setDraftSearch(event.target.value)}
          placeholder="Buscar por texto"
          className="min-h-9 w-full rounded-control border border-mist bg-paper pl-9 pr-3 text-sm text-ink placeholder:text-muted hover:border-mist-strong"
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-muted" htmlFor="content-sort">
          Ordenar por
        </label>
        <select
          id="content-sort"
          value={sort}
          onChange={(event) => apply({ sort: event.target.value as ContentSort })}
          className="min-h-9 rounded-control border border-mist bg-paper px-3 text-sm text-ink hover:border-mist-strong"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={() => apply({ direction: direction === "desc" ? "asc" : "desc" })}
        className="flex min-h-9 items-center gap-1.5 rounded-control border border-mist bg-paper px-3 text-xs font-medium text-graphite hover:border-mist-strong hover:text-ink"
      >
        <SortIcon className="size-3.5" />
        {orderedByDate
          ? direction === "desc"
            ? "Más reciente"
            : "Más antiguo"
          : direction === "desc"
            ? "Mayor → Menor"
            : "Menor → Mayor"}
      </button>

      <p aria-live="polite" className="ml-auto text-xs text-muted">
        {resultCount === 1 ? "1 pieza" : `${resultCount} piezas`}
      </p>
    </div>
  );
}


function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function SortIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M7 4v16m0 0-3.5-3.5M7 20l3.5-3.5" />
      <path d="M17 20V4m0 0-3.5 3.5M17 4l3.5 3.5" />
    </svg>
  );
}
