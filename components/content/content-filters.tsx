"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type SVGProps } from "react";
import {
  Button,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue,
} from "react-aria-components";
import type { ContentKind, ContentSortDirection } from "@/lib/content/library";
import { buildContentUrl, type ContentUrlState } from "@/lib/content/pagination";

type FilterState = Omit<ContentUrlState, "page">;
type LibrarySort = ContentUrlState["sort"];

export function ContentFilters({
  kind,
  search,
  sort,
  direction,
  sortOptions,
  resultCount,
  resultLabel = "pieza",
}: {
  kind: ContentKind;
  search: string;
  sort: LibrarySort;
  direction: ContentSortDirection;
  /** Cada formato ordena por lo suyo: las Historias, por secuencia. */
  sortOptions: { value: LibrarySort; label: string }[];
  resultCount: number;
  resultLabel?: string;
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
      {kind === "story" ? null : (
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
            className="min-h-8 w-full rounded-control border border-mist bg-paper pl-9 pr-3 text-[13px] text-ink placeholder:text-muted hover:border-mist-strong"
          />
        </div>
      )}

      <Select
        aria-label="Ordenar piezas por"
        selectedKey={sort}
        onSelectionChange={(key) => apply({ sort: String(key) as LibrarySort })}
        className="shrink-0"
      >
        <Button className="group flex min-h-8 min-w-32 items-center justify-between gap-2.5 rounded-control border border-mist bg-paper px-2.5 text-[12px] font-semibold text-graphite outline-none transition-colors hover:border-mist-strong hover:text-ink focus-visible:border-ink">
          <SelectValue />
          <ChevronDownIcon className="size-3.5 shrink-0 text-muted transition-transform group-data-[pressed]:translate-y-px" />
        </Button>
        <Popover
          placement="bottom start"
          offset={6}
          className="min-w-[var(--trigger-width)] overflow-hidden rounded-control border border-mist bg-paper p-1 text-[12px] font-medium text-ink shadow-[0_8px_24px_rgba(0,0,0,0.06)] outline-none"
        >
          <ListBox className="outline-none">
            {sortOptions.map((option) => (
              <ListBoxItem
                key={option.value}
                id={option.value}
                textValue={option.label}
                className={({ isFocused, isSelected }) =>
                  `flex cursor-default items-center justify-between gap-4 rounded-[7px] px-2.5 py-1.5 outline-none ${
                    isFocused || isSelected ? "bg-canvas text-ink" : "text-graphite"
                  }`
                }
              >
                {({ isSelected }) => (
                  <>
                    <span>{option.label}</span>
                    {isSelected ? <CheckIcon className="size-3.5 text-ink" /> : null}
                  </>
                )}
              </ListBoxItem>
            ))}
          </ListBox>
        </Popover>
      </Select>

      <button
        type="button"
        onClick={() => apply({ direction: direction === "desc" ? "asc" : "desc" })}
        className="flex min-h-8 items-center gap-1.5 rounded-control border border-mist bg-paper px-2.5 text-[12px] font-semibold text-graphite hover:border-mist-strong hover:text-ink"
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
        {resultCount === 1 ? `1 ${resultLabel}` : `${resultCount} ${resultLabel}s`}
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

function ChevronDownIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CheckIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}
