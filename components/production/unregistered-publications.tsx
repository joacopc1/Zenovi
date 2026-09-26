"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { linkPublishedMedia, registerPublishedMedia } from "@/app/(dashboard)/production/actions";
import { FORMAT_LABELS, contentItemName } from "@/lib/production/content";
import { suggestBoardPieces, type PublishedPiece } from "@/lib/production/reconcile";
import type { ContentItem } from "@/lib/data/production";

const dateFormatter = new Intl.DateTimeFormat("es-UY", { day: "numeric", month: "short" });

/**
 * El desajuste entre lo que salió en Instagram y lo que el tablero sabe.
 *
 * Son dos olvidos distintos con el mismo síntoma: o la idea estaba anotada y nadie movió
 * la tarjeta, o la pieza nunca se planificó. Por eso hay dos salidas: enlazarla con la
 * idea que ya existe —y ahí el guion que se escribió queda pegado a cómo rindió— o
 * registrarla como pieza nueva ya publicada.
 *
 * Va plegado y en una línea: es un recordatorio, no una tarea que la app exija terminar.
 */
export function UnregisteredPublications({
  publications,
  items,
}: {
  publications: PublishedPiece[];
  items: ContentItem[];
}) {
  const [open, setOpen] = useState(false);

  if (publications.length === 0) return null;

  return (
    <section aria-label="Publicaciones fuera del tablero" className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="font-support flex items-center gap-1.5 text-[12px] text-graphite transition-colors hover:text-ink"
      >
        <ChevronDown
          size={13}
          strokeWidth={1.75}
          aria-hidden="true"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
        {publications.length === 1
          ? "Publicaste una pieza que no está en el tablero"
          : `Publicaste ${publications.length} piezas que no están en el tablero`}
      </button>

      {open ? (
        <ul className="mt-2 space-y-1.5">
          {publications.map((publication) => (
            <Row key={publication.id} publication={publication} items={items} />
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function Row({ publication, items }: { publication: PublishedPiece; items: ContentItem[] }) {
  const [choosing, setChoosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const suggestions = suggestBoardPieces(items, publication);

  function run(action: () => Promise<{ status: string; message?: string }>) {
    startTransition(async () => {
      setError(null);
      const result = await action();
      if (result.status === "error") {
        setError(result.message ?? "No pudimos guardarlo.");
      }
    });
  }

  return (
    <li className="rounded-control border border-mist p-2">
      <div className="flex items-center gap-3">
        <Thumbnail url={publication.thumbnailUrl} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-medium text-ink">
            {publication.caption?.replace(/\s+/g, " ").trim() || "Sin texto"}
          </p>
          <p className="font-support mt-0.5 text-[11px] text-muted">
            {FORMAT_LABELS[publication.kind]} · {dateFormatter.format(new Date(publication.postedAt))}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {suggestions.length > 0 ? (
            <button
              type="button"
              onClick={() => setChoosing((current) => !current)}
              disabled={pending}
              className="h-7 rounded-control border border-mist px-2.5 text-[11px] font-medium text-graphite transition-colors hover:border-mist-strong hover:text-ink disabled:opacity-50"
            >
              Es una idea mía
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => run(() => registerPublishedMedia({ status: "idle" }, { mediaId: publication.id }))}
            disabled={pending}
            className="h-7 rounded-control bg-ink px-2.5 text-[11px] font-semibold text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Guardando…" : "Registrar"}
          </button>
        </div>
      </div>

      {choosing ? (
        <ul className="mt-2 space-y-1 border-t border-mist pt-2">
          {suggestions.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  run(() =>
                    linkPublishedMedia({ status: "idle" }, { id: item.id, mediaId: publication.id }),
                  )
                }
                className="w-full truncate rounded-control px-2 py-1.5 text-left text-[12px] text-ink transition-colors hover:bg-canvas disabled:opacity-50"
              >
                {contentItemName(item)}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? (
        <p role="alert" className="mt-1.5 text-[11px] text-danger">
          {error}
        </p>
      ) : null}
    </li>
  );
}

function Thumbnail({ url }: { url: string | null }) {
  if (!url) {
    return <div aria-hidden="true" className="size-9 shrink-0 rounded-control bg-canvas" />;
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
