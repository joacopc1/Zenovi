"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  Link2,
  MessageSquareText,
  Pencil,
  Play,
  X,
} from "lucide-react";
import {
  moveContentItem,
  rescheduleContentItem,
} from "@/app/(dashboard)/production/actions";
import {
  FORMAT_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  contentItemName,
  formatTargetDate,
  type ContentStatus,
  shortReference,
} from "@/lib/production/content";
import { countWords, formatSpokenDuration } from "@/lib/production/teleprompter";
import type { ContentItem } from "@/lib/data/production";
import type { PublishCandidate, PublishedPerformance } from "@/lib/data/production-links";
import { ContentItemForm } from "./content-item-form";
import { DateField } from "./date-field";
import { ProductionTeleprompter } from "./production-teleprompter";
import { PublishedLink } from "./published-link";

/**
 * El detalle de una pieza, en un panel que sale de la derecha.
 *
 * Está ordenado por lo que se hace con la pieza y no por cómo está guardada: arriba qué
 * pieza es y para cuándo, en el medio el guion —que es el trabajo— y abajo qué es y para
 * qué sirve, más el resultado si ya salió.
 *
 * Hay dos alcances de edición porque son dos gestos distintos: el lápiz del guion abre
 * sólo el guion, que es lo que más se retoca, y el botón del pie abre la pieza entera.
 */
export function ProductionDetail({
  item,
  candidates,
  performance,
  contentTypes,
  startEditing = false,
  onClose,
}: {
  item: ContentItem;
  candidates: PublishCandidate[];
  performance: PublishedPerformance | null;
  /** Los tipos que el creador ya usó, para que editar no invente una categoría nueva. */
  contentTypes: readonly string[];
  /** Abrir directo en edición, para cuando se entró desde "Editar" en el tablero. */
  startEditing?: boolean;
  onClose: () => void;
}) {
  const [editing, setEditing] = useState<"all" | "script" | null>(startEditing ? "all" : null);
  const [recording, setRecording] = useState(false);
  const [pending, startTransition] = useTransition();
  const hasScript = Boolean(item.hook || item.development || item.cta);

  useEffect(() => {
    // Mientras el modo grabación está abierto, Escape le pertenece a él: los dos escuchan
    // en la ventana, y sin esto una sola tecla cerraba el apuntador y el panel de atrás.
    if (recording) return;

    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, recording]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-ink/20" onClick={onClose} aria-hidden="true" />

      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col border-l border-mist bg-paper">
        <header className="relative shrink-0 px-5 pb-3 pt-4">
          {/* Primero dónde está y para cuándo, después cómo se llama: al abrir una pieza se
              busca ubicarla antes que nombrarla, porque el nombre ya se conocía al tocarla. */}
          {editing !== null ? null : (
            <div className="mb-2.5 flex flex-wrap items-center gap-2 pr-9">
              <StatusPill item={item} />
              <DateControl item={item} />
              {/* Desarrollar la idea con el Director: abre un chat nuevo con la idea cargada. */}
              <Link
                href={`/director?idea=${item.id}`}
                className="inline-flex min-h-7 items-center gap-1.5 rounded-full border border-mist px-2.5 text-[12px] font-medium text-ink hover:bg-canvas"
              >
                <MessageSquareText aria-hidden="true" className="size-3.5" strokeWidth={1.7} />
                Llevar al Director
              </Link>
            </div>
          )}

          <h2 className="flex min-w-0 items-center gap-1.5 pr-9 text-[19px] font-semibold leading-6 tracking-[-0.01em]">
            {editing !== null ? (
              <button
                type="button"
                onClick={() => setEditing(null)}
                aria-label="Volver sin guardar"
                className="-ml-1.5 grid size-7 shrink-0 place-items-center rounded-control text-graphite transition-colors hover:bg-canvas hover:text-ink"
              >
                <ArrowLeft size={17} strokeWidth={1.75} />
              </button>
            ) : null}
            <span className="min-w-0 truncate">
              {editing === "script"
                ? "Editar el guion"
                : editing === "all"
                  ? "Editar la pieza"
                  : contentItemName(item)}
            </span>
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="absolute right-3.5 top-3.5 grid size-8 place-items-center rounded-control text-graphite transition-colors hover:bg-canvas hover:text-ink"
            aria-label="Cerrar detalle"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-1">
          {editing !== null ? (
            <ContentItemForm
              item={item}
              contentTypes={contentTypes}
              scope={editing}
              onDelete={onClose}
              onDone={() => setEditing(null)}
            />
          ) : (
            <div className="space-y-6">
              <Script
                item={item}
                hasScript={hasScript}
                onWrite={() => setEditing("script")}
                onRecord={() => setRecording(true)}
              />
              <Purpose item={item} />

              {item.status === "publicada" ? (
                <PublishedLink
                  itemId={item.id}
                  candidates={candidates}
                  performance={performance}
                />
              ) : null}

            </div>
          )}
        </div>

        {editing !== null ? null : (
          <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-mist px-5 py-3">
            <button
              type="button"
              onClick={() => setEditing("all")}
              className="inline-flex h-8 items-center gap-1.5 rounded-control border border-mist-strong px-3 text-[12px] font-semibold text-ink transition-colors hover:bg-canvas"
            >
              <Pencil size={13} strokeWidth={1.75} aria-hidden="true" />
              Editar la pieza
            </button>
            {nextLabel(item.status) ? (
              <button
                type="button"
                onClick={() =>
                  startTransition(async () => {
                    await moveContentItem({ status: "idle" }, { id: item.id, direction: "forward" });
                  })
                }
                disabled={pending}
                className="inline-flex h-8 items-center gap-1 rounded-control bg-ink px-3 text-[12px] font-semibold text-paper transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
              >
                {nextLabel(item.status)}
                <ChevronRight size={14} strokeWidth={1.75} />
              </button>
            ) : null}
          </footer>
        )}

      </aside>

      {recording ? (
        <ProductionTeleprompter item={item} onClose={() => setRecording(false)} />
      ) : null}
    </>
  );
}

/**
 * El estado, y cambiarlo sin salir del panel.
 *
 * Abrir una pieza para ver en qué anda y tener que cerrarla, buscarla en el tablero y
 * arrastrarla para moverla es un viaje de ida y vuelta por algo que ya se está mirando.
 * El punto de color es el mismo que en el tablero y el calendario.
 */
function StatusPill({ item }: { item: ContentItem }) {
  return (
    <span className="font-support inline-flex shrink-0 items-center gap-1.5 rounded-full border border-mist bg-paper px-2 py-0.5 text-[11px] font-medium text-graphite">
      <StatusDot status={item.status} />
      {STATUS_LABELS[item.status]}
    </span>
  );
}

function StatusDot({ status }: { status: ContentStatus }) {
  return (
    <span
      aria-hidden="true"
      className="size-2 shrink-0 rounded-full"
      style={{ backgroundColor: STATUS_COLORS[status] }}
    />
  );
}

/**
 * La fecha objetivo, cambiable desde acá.
 *
 * Alineada con el estado y a la derecha: son las dos decisiones que se toman mirando la
 * pieza —en qué etapa está y para cuándo es—, así que viven en el mismo renglón.
 */
function DateControl({ item }: { item: ContentItem }) {
  const [pending, startTransition] = useTransition();

  if (item.status === "publicada") {
    return (
      <span className="font-support flex items-center gap-1.5 text-[11px] text-muted">
        <CalendarDays size={13} strokeWidth={1.75} aria-hidden="true" />
        <span className="font-numeric">
          {item.publishedAt
            ? `Salió el ${formatTargetDate(item.publishedAt.slice(0, 10))}`
            : "Publicada"}
        </span>
      </span>
    );
  }

  return (
    <span className={`shrink-0 transition-opacity ${pending ? "opacity-60" : ""}`}>
      <DateField
        compact
        value={item.targetDate}
        onChange={(value) =>
          startTransition(async () => {
            await rescheduleContentItem({ status: "idle" }, { id: item.id, targetDate: value });
          })
        }
      />
    </span>
  );
}

/**
 * Qué es la pieza y de dónde salió.
 *
 * Va después del guion y no antes. Abrir una pieza es ir a leer lo que se va a decir en
 * cámara; el formato, el tipo y la referencia explican ese guion, así que se leen cuando
 * ya se sabe de qué trata.
 */
function Purpose({ item }: { item: ContentItem }) {
  return (
    <div className="space-y-2.5 border-t border-mist pt-4">
      {/* "Reel → atracción" se lee como lo que la pieza es y para qué sirve. Los dos sueltos
          uno al lado del otro parecían dos etiquetas sin relación entre sí. */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-support rounded-full border border-mist bg-paper px-2 py-0.5 text-[11px] font-medium text-graphite">
          {FORMAT_LABELS[item.format]}
        </span>
        {item.contentType ? (
          <>
            <ArrowRight size={12} strokeWidth={1.75} aria-hidden="true" className="text-muted" />
            <span className="font-support rounded-full border border-mist bg-paper px-2 py-0.5 text-[11px] font-medium text-graphite">
              {item.contentType}
            </span>
          </>
        ) : null}
      </div>

      {item.referenceUrl ? (
        <a
          href={item.referenceUrl}
          target="_blank"
          rel="noreferrer"
          className="font-support flex min-w-0 items-center gap-1.5 text-[12px] text-graphite transition-colors hover:text-ink"
        >
          <Link2 size={13} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />
          <span className="truncate underline decoration-mist-strong underline-offset-4">
            {shortReference(item.referenceUrl)}
          </span>
        </a>
      ) : null}

    </div>
  );
}

/** El guion, que es el trabajo de la pieza; por eso ocupa el centro del panel. */
function Script({
  item,
  hasScript,
  onWrite,
  onRecord,
}: {
  item: ContentItem;
  hasScript: boolean;
  onWrite: () => void;
  onRecord: () => void;
}) {
  if (!hasScript) {
    return (
      <div className="rounded-card border border-mist bg-paper p-4">
        <SectionTitle>Guion</SectionTitle>
        <div className="mt-3.5 rounded-card border border-dashed border-mist px-4 py-6 text-center">
          <p className="font-support text-[12px] leading-5 text-muted">
            Todavía no tiene guion. Es lo que vas a leer frente a cámara.
          </p>
          <button
            type="button"
            onClick={onWrite}
            className="mt-3 h-8 rounded-control border border-mist-strong px-3 text-[12px] font-medium text-ink transition-colors hover:bg-ink/[0.03]"
          >
            Escribir el guion
          </button>
        </div>
      </div>
    );
  }

  const words = countWords(`${item.hook} ${item.development} ${item.cta}`);

  return (
    <div className="rounded-card border border-mist bg-paper p-4">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <SectionTitle>Guion</SectionTitle>
        </div>
        <button
          type="button"
          onClick={onWrite}
          title="Editar el guion"
          aria-label="Editar el guion"
          className="grid size-7 shrink-0 place-items-center rounded-control border border-mist text-graphite transition-colors hover:border-mist-strong hover:text-ink"
        >
          <Pencil size={13} strokeWidth={1.75} />
        </button>
      </div>
      <div className="mt-3.5 space-y-4">
        <ScriptPart label="Hook" value={item.hook} />
        <ScriptPart label="Desarrollo" value={item.development} />
        <ScriptPart label="CTA" value={item.cta} />
      </div>

      {/* Cuánto dura leído en voz alta. Es el dato que falta antes de grabar: un Reel de
          dos minutos no es el mismo contenido que uno de treinta segundos, y eso se
          descubre grabando si la app no lo dice acá. */}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-mist pt-3">
        <p className="font-support flex items-center gap-1.5 text-[11px] text-muted">
          <Clock3 size={12} strokeWidth={1.75} aria-hidden="true" />
          <span className="font-numeric">{words}</span> palabras · cerca de{" "}
          <span className="font-numeric">{formatSpokenDuration(words)}</span> hablando
        </p>
        <button
          type="button"
          onClick={onRecord}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-control bg-ink px-3 text-[12px] font-semibold text-paper transition-opacity hover:opacity-90"
        >
          <Play size={13} strokeWidth={1.75} aria-hidden="true" />
          Grabar
        </button>
      </div>
    </div>
  );
}

/**
 * Las tres partes se ven iguales a propósito.
 *
 * Antes el hook iba más grande y las otras dos en gris, y se leían como tres cosas
 * distintas cuando son tres tramos del mismo texto que se va a decir seguido frente a
 * cámara. Lo que las separa es la etiqueta, no el tamaño.
 */
function ScriptPart({ label, value }: { label: string; value: string }) {
  if (!value) return null;

  return (
    <div>
      <span className="block text-[10px] font-semibold uppercase tracking-wide text-graphite">
        {label}
      </span>
      <p className="mt-1 whitespace-pre-line text-[14px] leading-6 text-ink">{value}</p>
    </div>
  );
}

/** Un título de sección con su línea, para que el guion arranque en algún lado. */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink">
        {children}
      </span>
      <span aria-hidden="true" className="h-px flex-1 bg-mist" />
    </div>
  );
}

/** Cómo se llama la etapa que sigue. Vacío cuando ya está publicada y no hay a dónde ir. */
function nextLabel(status: ContentStatus): string {
  if (status === "idea") return "Al guion";
  if (status === "guion") return "A producción";
  return status === "produccion" ? "Publicar" : "";
}
