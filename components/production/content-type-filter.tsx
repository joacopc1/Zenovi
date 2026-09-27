"use client";

import { collectContentTypes } from "@/lib/production/content";
import type { ContentItem } from "@/lib/data/production";

/**
 * El filtro por el vocabulario del creador.
 *
 * Zenovi no ofrece una lista de pilares ni de categorías de marketing: muestra los tipos
 * que la persona viene escribiendo en sus piezas. Por eso no aparece hasta que hay al
 * menos dos —con uno solo no hay nada que filtrar— y desaparece si deja de usarlos.
 *
 * Va pegado al tablero y no como bloque aparte porque es un control del tablero, igual
 * que las pestañas: cambia lo que se ve, no agrega información.
 */
export function ContentTypeFilter({
  items,
  active,
  onChange,
  className = "",
}: {
  items: ContentItem[];
  active: string | null;
  onChange: (type: string | null) => void;
  className?: string;
}) {
  const types = collectContentTypes(items);

  if (types.length < 2) return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 ${className}`}
      role="group"
      aria-label="Filtrar por tipo"
    >
      <Chip selected={active === null} onClick={() => onChange(null)}>
        Todas
      </Chip>
      {types.map((type) => (
        <Chip
          key={type.value}
          selected={active !== null && active === type.value}
          onClick={() => onChange(active === type.value ? null : type.value)}
        >
          {type.value}
          <span className="font-numeric ml-1 text-[10px] opacity-60">{type.count}</span>
        </Chip>
      ))}
    </div>
  );
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`h-7 rounded-full border px-2.5 text-[11px] font-medium transition-colors ${
        selected
          ? "border-ink bg-ink text-paper"
          : "border-mist text-graphite hover:border-mist-strong hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
