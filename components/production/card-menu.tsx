"use client";

import { useState, useTransition } from "react";
import { Check, Copy, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { deleteContentItem } from "@/app/(dashboard)/production/actions";
import { scriptAsText } from "@/lib/production/content";
import type { ContentItem } from "@/lib/data/production";
import { useDismissibleDetails } from "@/components/shell/use-dismissible-details";

/**
 * El menú de la tarjeta, arriba a la derecha.
 *
 * Existe para lo que no se puede hacer arrastrando: editar y borrar. Sin él, borrar una
 * pieza obligaba a abrirla, bajar hasta el final del panel y recién ahí encontrar el
 * tacho, para algo que muchas veces se decide mirando el tablero.
 *
 * Frena todos los eventos de puntero: la tarjeta entera abre el detalle y además se
 * arrastra, así que sin eso tocar el menú movería la pieza o abriría el panel.
 */
export function CardMenu({ item, onEdit }: { item: ContentItem; onEdit: () => void }) {
  const detailsRef = useDismissibleDetails();
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const script = scriptAsText(item);

  const stop = (event: React.SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  function close() {
    detailsRef.current?.removeAttribute("open");
    setConfirming(false);
    setCopied(false);
  }

  /**
   * Copiar el guion al portapapeles.
   *
   * No abre nada ni manda a ningún lado: se pega donde haga falta —un chat con el editor,
   * las notas del teléfono—. Si el navegador no da permiso, el menú lo dice en vez de
   * fingir que copió.
   */
  function copy() {
    navigator.clipboard
      .writeText(script)
      .then(() => setCopied(true))
      .catch(() => setCopied(false));
  }

  return (
    <details
      ref={detailsRef}
      className="relative shrink-0"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <summary
        aria-label="Acciones de la pieza"
        className="grid size-6 cursor-pointer list-none place-items-center rounded-control text-muted transition-colors hover:bg-canvas hover:text-ink [&::-webkit-details-marker]:hidden"
      >
        <MoreVertical size={15} strokeWidth={1.75} />
      </summary>

      <div className="absolute right-0 top-full z-40 mt-1 w-40 overflow-hidden rounded-card border border-mist-strong bg-paper py-1">
        <button
          type="button"
          onClick={(event) => {
            stop(event);
            close();
            onEdit();
          }}
          className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[12px] font-medium text-ink transition-colors hover:bg-canvas"
        >
          <Pencil size={13} strokeWidth={1.75} aria-hidden="true" />
          Editar
        </button>

        {script ? (
          <button
            type="button"
            onClick={(event) => {
              stop(event);
              copy();
            }}
            className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[12px] font-medium text-ink transition-colors hover:bg-canvas"
          >
            {copied ? (
              <Check size={13} strokeWidth={2} aria-hidden="true" className="text-success" />
            ) : (
              <Copy size={13} strokeWidth={1.75} aria-hidden="true" />
            )}
            {copied ? "Guion copiado" : "Copiar el guion"}
          </button>
        ) : null}

        {confirming ? (
          <div className="border-t border-mist px-2.5 py-2">
            <p className="font-support text-[11.5px] font-semibold leading-4 text-ink">
              Se borra de Zenovi con lo que hayas escrito.
            </p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <button
                type="button"
                disabled={pending}
                onClick={(event) => {
                  stop(event);
                  startTransition(async () => {
                    await deleteContentItem({ status: "idle" }, { id: item.id });
                  });
                }}
                className="h-7 rounded-control bg-danger px-2.5 text-[11px] font-semibold text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {pending ? "Borrando…" : "Borrar"}
              </button>
              <button
                type="button"
                onClick={(event) => {
                  stop(event);
                  setConfirming(false);
                }}
                className="h-7 rounded-control px-2 text-[11px] font-medium text-graphite transition-colors hover:text-ink"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={(event) => {
              stop(event);
              setConfirming(true);
            }}
            className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[12px] font-medium text-ink transition-colors hover:bg-canvas hover:text-danger"
          >
            <Trash2 size={13} strokeWidth={1.75} aria-hidden="true" />
            Eliminar
          </button>
        )}
      </div>
    </details>
  );
}
