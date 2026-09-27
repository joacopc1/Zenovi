"use client";

import { useEffect, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Clock3, Link2, Play, Target, Trash2, X } from "lucide-react";
import {
  deleteContentItem,
  moveContentItem,
} from "@/app/(dashboard)/production/actions";
import {
  CONTENT_PIPELINE,
  FORMAT_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  contentItemName,
  formatTargetDate,
  shortReference,
} from "@/lib/production/content";
import { OBJECTIVE_COPY } from "@/lib/production/objective";
import { countWords, formatSpokenDuration } from "@/lib/production/teleprompter";
import type { ContentItem } from "@/lib/data/production";
import type { PublishCandidate, PublishedPerformance } from "@/lib/data/production-links";
import { ContentItemForm } from "./content-item-form";
import { ProductionTeleprompter } from "./production-teleprompter";
import { PublishedLink } from "./published-link";

/**
 * El detalle de una pieza, en un panel que sale de la derecha.
 *
 * Está ordenado por lo que se hace con la pieza y no por cómo está guardada: arriba qué
 * es y para qué, en el medio el guion —que es el trabajo— y abajo el resultado si ya
 * salió. Los datos sueltos (fecha, referencia, formato) van en una sola línea al pie de
 * la cabecera, porque son de consulta y no merecen un bloque cada uno.
 */
export function ProductionDetail({
  item,
  candidates,
  performance,
  contentTypes,
  onClose,
}: {
  item: ContentItem;
  candidates: PublishCandidate[];
  performance: PublishedPerformance | null;
  contentTypes: readonly string[];
  onClose: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [pending, startTransition] = useTransition();
  const index = CONTENT_PIPELINE.indexOf(item.status);
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

  const move = (direction: "back" | "forward") => {
    startTransition(async () => {
      await moveContentItem({ status: "idle" }, { id: item.id, direction });
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-ink/20" onClick={onClose} aria-hidden="true" />

      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col border-l border-mist bg-paper">
        <header className="shrink-0 border-b border-mist px-5 pb-3 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[item.status] }}
                />
                <span className="font-support text-[11px] font-medium text-graphite">
                  {STATUS_LABELS[item.status]}
                </span>
              </span>
              <h2 className="mt-1 text-[17px] font-semibold leading-6 tracking-[-0.01em]">
                {editing ? "Editar la pieza" : contentItemName(item)}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid size-8 shrink-0 place-items-center rounded-control text-graphite transition-colors hover:text-ink"
              aria-label="Cerrar detalle"
            >
              <X size={16} strokeWidth={1.75} />
            </button>
          </div>

          {editing ? null : <Facts item={item} />}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {editing ? (
            <ContentItemForm
              item={item}
              contentTypes={contentTypes}
              onDone={() => setEditing(false)}
            />
          ) : (
            <div className="space-y-6">
              <Objective item={item} />
              <Script item={item} hasScript={hasScript} onWrite={() => setEditing(true)} />

              {item.status === "publicada" ? (
                <PublishedLink
                  itemId={item.id}
                  candidates={candidates}
                  performance={performance}
                />
              ) : null}

              <div className="flex items-center gap-2 border-t border-mist pt-4">
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="inline-flex h-8 flex-1 items-center justify-center rounded-control border border-mist-strong text-[12px] font-medium text-ink transition-colors hover:bg-ink/[0.03]"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setRecording(true)}
                  disabled={!hasScript}
                  className="inline-flex h-8 items-center gap-1.5 rounded-control bg-ink px-3 text-[12px] font-semibold text-paper transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
                >
                  <Play size={13} strokeWidth={1.75} aria-hidden="true" />
                  Grabar
                </button>
              </div>
            </div>
          )}
        </div>

        {editing ? null : (
          <footer className="relative flex shrink-0 items-center gap-2 border-t border-mist px-5 py-4">
            <DeleteButton item={item} onDeleted={onClose} />
            <button
              type="button"
              onClick={() => move("back")}
              disabled={pending || index === 0}
              className="inline-flex h-8 items-center gap-1 rounded-control px-2.5 text-[12px] font-medium text-graphite transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronLeft size={14} strokeWidth={1.75} />
              Anterior
            </button>
            <button
              type="button"
              onClick={() => move("forward")}
              disabled={pending || index === CONTENT_PIPELINE.length - 1}
              className="ml-auto inline-flex h-8 items-center gap-1 rounded-control bg-ink px-3 text-[12px] font-semibold text-paper transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-30"
            >
              {nextLabel(item.status)}
              <ChevronRight size={14} strokeWidth={1.75} />
            </button>
          </footer>
        )}
      </aside>

      {recording ? (
        <ProductionTeleprompter item={item} onClose={() => setRecording(false)} />
      ) : null}
    </>
  );
}

/** Formato, tipo, fecha y referencia en un renglón: son de consulta, no de lectura. */
function Facts({ item }: { item: ContentItem }) {
  return (
    <div className="font-support mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
      <span className="text-graphite">{FORMAT_LABELS[item.format]}</span>
      {item.contentType ? (
        <>
          <Dot />
          <span>{item.contentType}</span>
        </>
      ) : null}
      {item.targetDate ? (
        <>
          <Dot />
          <span className="font-numeric">{formatTargetDate(item.targetDate, "short")}</span>
        </>
      ) : null}
      {item.referenceUrl ? (
        <>
          <Dot />
          <a
            href={item.referenceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex max-w-[18ch] items-center gap-1 truncate text-graphite underline decoration-mist-strong underline-offset-4 transition-colors hover:text-ink"
          >
            <Link2 size={11} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />
            {shortReference(item.referenceUrl)}
          </a>
        </>
      ) : null}
    </div>
  );
}

function Dot() {
  return (
    <span aria-hidden="true" className="text-mist-strong">
      ·
    </span>
  );
}

/** Para qué se hizo. Si no se eligió, se dice contra qué se la va a medir igual. */
function Objective({ item }: { item: ContentItem }) {
  return (
    <div className="flex items-start gap-2.5">
      <Target
        size={15}
        strokeWidth={1.75}
        aria-hidden="true"
        className={`mt-0.5 shrink-0 ${item.objective ? "text-ink" : "text-muted"}`}
      />
      <p className="font-support text-[13px] leading-5">
        {item.objective ? (
          <>
            <span className="font-medium text-ink">{OBJECTIVE_COPY[item.objective].label}.</span>{" "}
            <span className="text-muted">{OBJECTIVE_COPY[item.objective].hint}</span>
          </>
        ) : (
          <span className="text-muted">
            Sin objetivo elegido: se va a medir por visualizaciones.
          </span>
        )}
      </p>
    </div>
  );
}

/** El guion, que es el trabajo de la pieza; por eso ocupa el centro del panel. */
function Script({
  item,
  hasScript,
  onWrite,
}: {
  item: ContentItem;
  hasScript: boolean;
  onWrite: () => void;
}) {
  if (!hasScript) {
    return (
      <div className="rounded-card border border-dashed border-mist px-4 py-6 text-center">
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
    );
  }

  const words = countWords(`${item.hook} ${item.development} ${item.cta}`);

  return (
    <div className="space-y-4">
      <ScriptPart label="Hook" value={item.hook} lead />
      <ScriptPart label="Desarrollo" value={item.development} />
      <ScriptPart label="CTA" value={item.cta} />

      {/* Cuánto dura leído en voz alta. Es el dato que falta antes de grabar: un Reel de
          dos minutos no es el mismo contenido que uno de treinta segundos, y eso se
          descubre grabando si la app no lo dice acá. */}
      <p className="font-support flex items-center gap-1.5 border-t border-mist pt-3 text-[11px] text-muted">
        <Clock3 size={12} strokeWidth={1.75} aria-hidden="true" />
        <span className="font-numeric">{words}</span> palabras · cerca de{" "}
        <span className="font-numeric">{formatSpokenDuration(words)}</span> hablando
      </p>
    </div>
  );
}

/** El hook va más grande: es la parte que decide si alguien se queda. */
function ScriptPart({ label, value, lead = false }: { label: string; value: string; lead?: boolean }) {
  if (!value) return null;

  return (
    <div>
      <span className="block text-[10px] font-medium uppercase tracking-wide text-muted">
        {label}
      </span>
      <p
        className={`mt-1 whitespace-pre-line text-ink ${
          lead ? "text-[15px] font-medium leading-6" : "text-[13px] leading-6 text-graphite"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/**
 * Borrar la pieza, con la confirmación en el mismo botón.
 *
 * No abre un diálogo: el primer click descubre la advertencia y el segundo borra, que
 * para una acción de esta escala alcanza y no interrumpe. Se aclara qué se pierde —sólo
 * lo que se escribió en Zenovi— porque la duda al borrar una pieza publicada es si
 * también le pasa algo al video, y no le pasa nada.
 */
function DeleteButton({ item, onDeleted }: { item: ContentItem; onDeleted: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label="Borrar la pieza"
        title="Borrar la pieza"
        className="grid size-8 shrink-0 place-items-center rounded-control text-muted transition-colors hover:bg-danger/10 hover:text-danger"
      >
        <Trash2 size={15} strokeWidth={1.75} aria-hidden="true" />
      </button>
    );
  }

  return (
    <div className="absolute inset-x-0 bottom-0 border-t border-mist bg-paper px-5 py-4">
      <p className="font-support text-[12px] leading-5 text-graphite">
        Se borra de Zenovi con lo que hayas escrito acá.
        {item.linkedMediaId ? " El video sigue publicado en Instagram." : ""}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() =>
            startTransition(async () => {
              const result = await deleteContentItem({ status: "idle" }, { id: item.id });
              if (result.status === "error") {
                setError(result.message ?? "No pudimos borrar la pieza.");
                setConfirming(false);
              } else {
                onDeleted();
              }
            })
          }
          disabled={pending}
          className="h-8 rounded-control bg-danger px-3 text-[12px] font-semibold text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Borrando…" : "Borrar"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="h-8 rounded-control px-2 text-[12px] font-medium text-graphite transition-colors hover:text-ink"
        >
          Cancelar
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-1 text-[12px] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function nextLabel(status: ContentItem["status"]) {
  if (status === "idea") return "Al guión";
  if (status === "guion") return "A producción";
  return status === "produccion" ? "Publicar" : "";
}
