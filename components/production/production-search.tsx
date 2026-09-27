"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { FORMAT_LABELS, STATUS_COLORS, STATUS_LABELS, contentItemName } from "@/lib/production/content";
import type { ContentItem } from "@/lib/data/production";
import type { ProductionLinks } from "@/lib/data/production-links";

/**
 * Encontrar una pieza entre todas.
 *
 * Cerrada es una lupa y nada más: no roba espacio a lo que importa, que es el tablero. Al
 * abrirse crece hacia la izquierda, hacia el espacio vacío, y no empuja el botón de cargar
 * una idea a otro lugar.
 *
 * No filtra el tablero, lleva a la pieza. Filtrar y buscar a la vez deja al creador sin
 * saber si lo que no ve es que no existe o que está escondido; así, lo que encuentra se
 * abre y el tablero queda como estaba.
 */
export function ProductionSearch({
  query,
  matches,
  links,
  onQueryChange,
  onOpen,
}: {
  query: string;
  matches: ContentItem[];
  links: ProductionLinks;
  onQueryChange: (query: string) => void;
  onOpen: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  });

  function close() {
    setOpen(false);
    onQueryChange("");
  }

  return (
    <div ref={containerRef} className="relative flex items-center justify-end">
      <div
        className={`flex items-center overflow-hidden rounded-control border border-mist bg-paper transition-[width,border-color] duration-200 ${
          open ? "w-64 border-mist-strong" : "w-9"
        }`}
      >
        <button
          type="button"
          onClick={() => {
            if (open) close();
            else {
              setOpen(true);
              // El foco después del cuadro siguiente: mientras el campo mide cero, el
              // navegador no le da el cursor.
              requestAnimationFrame(() => inputRef.current?.focus());
            }
          }}
          aria-label={open ? "Cerrar la búsqueda" : "Buscar una pieza"}
          aria-expanded={open}
          className="grid size-9 shrink-0 place-items-center text-graphite transition-colors hover:text-ink"
        >
          <Search size={15} strokeWidth={1.75} />
        </button>

        <input
          ref={inputRef}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Título, guion, tipo…"
          tabIndex={open ? undefined : -1}
          className="font-support h-9 min-w-0 flex-1 bg-transparent pr-2 text-[12px] text-ink placeholder:text-muted focus:outline-none"
        />

        {query ? (
          <button
            type="button"
            onClick={() => {
              onQueryChange("");
              inputRef.current?.focus();
            }}
            aria-label="Limpiar la búsqueda"
            className="grid size-7 shrink-0 place-items-center text-muted transition-colors hover:text-ink"
          >
            <X size={13} strokeWidth={1.75} />
          </button>
        ) : null}
      </div>

      {open && query.trim().length > 0 ? (
        <div className="absolute right-0 top-10 z-30 w-64 overflow-hidden rounded-card border border-mist-strong bg-paper">
          {matches.length === 0 ? (
            <p className="font-support px-3 py-3 text-[12px] text-muted">
              Ninguna pieza dice eso.
            </p>
          ) : (
            <ul>
              {matches.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onOpen(item.id);
                      close();
                    }}
                    className="flex w-full items-center gap-2.5 px-2.5 py-2 text-left transition-colors hover:bg-canvas"
                  >
                    <Cover url={links.performance[item.id]?.thumbnailUrl ?? null} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-medium text-ink">
                        {contentItemName(item)}
                      </span>
                      <span className="font-support mt-0.5 flex items-center gap-1.5 text-[11px] text-muted">
                        <span
                          aria-hidden="true"
                          className="size-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: STATUS_COLORS[item.status] }}
                        />
                        {STATUS_LABELS[item.status]} · {FORMAT_LABELS[item.format]}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

/** La portada de la pieza. Sólo la tienen las publicadas; el resto ocupa el mismo lugar. */
function Cover({ url }: { url: string | null }) {
  if (!url) {
    return <span aria-hidden="true" className="size-9 shrink-0 rounded-control bg-canvas" />;
  }

  return (
    <Image
      src={url}
      alt=""
      width={36}
      height={36}
      className="size-9 shrink-0 rounded-control object-cover"
    />
  );
}
