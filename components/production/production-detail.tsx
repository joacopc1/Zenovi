"use client";

import { useEffect, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Play, Trash2, X } from "lucide-react";
import {
  deleteContentItem,
  moveContentItem,
  updateContentItem,
} from "@/app/(dashboard)/production/actions";
import {
  CONTENT_PIPELINE,
  FORMAT_LABELS,
  STATUS_LABELS,
  formatTargetDate,
  type ContentFormat,
  contentItemName,
} from "@/lib/production/content";
import type { ContentItem } from "@/lib/data/production";
import type { PublishCandidate, PublishedPerformance } from "@/lib/data/production-links";
import { ProductionTeleprompter } from "./production-teleprompter";
import { PublishedLink } from "./published-link";
import { DateField } from "./date-field";
import { FormatSelect } from "./format-select";

/**
 * Drawer de detalle: sale de la derecha, ocupa toda la altura y se cierra con la X,
 * con Escape o haciendo click fuera.
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
  /** Los tipos que el creador ya usó, para que editar no invente una categoría nueva. */
  contentTypes: readonly string[];
  onClose: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [pending, startTransition] = useTransition();
  const index = CONTENT_PIPELINE.indexOf(item.status);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const move = (direction: "back" | "forward") => {
    startTransition(async () => {
      await moveContentItem({ status: "idle" }, { id: item.id, direction });
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-ink/20" onClick={onClose} aria-hidden="true" />

      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col border-l border-mist bg-paper">
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-mist px-5 py-4">
          <div className="min-w-0">
            {editing ? (
              <h2 className="text-base font-semibold tracking-[-0.01em]">Editar</h2>
            ) : (
              <h2 className="text-base font-semibold leading-6 tracking-[-0.01em]">{contentItemName(item)}</h2>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 shrink-0 place-items-center rounded-control text-graphite transition-colors hover:text-ink"
            aria-label="Cerrar detalle"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {editing ? (
            <EditForm item={item} contentTypes={contentTypes} onDone={() => setEditing(false)} />
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-1.5">
                {item.contentType ? <Pill text={item.contentType} /> : null}
                <Pill text={FORMAT_LABELS[item.format]} muted />
                <Pill text={STATUS_LABELS[item.status]} status />
              </div>

              {item.targetDate ? (
                <div>
                  <span className="block text-[10px] font-medium uppercase tracking-wide text-muted">Fecha objetivo</span>
                  <p className="font-numeric mt-0.5 text-[13px] text-ink">
                    {formatTargetDate(item.targetDate)}
                  </p>
                </div>
              ) : null}

              {item.referenceUrl ? (
                <div>
                  <span className="block text-[10px] font-medium uppercase tracking-wide text-muted">Referencia</span>
                  <a
                    href={item.referenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-0.5 block truncate text-[13px] text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink"
                  >
                    {item.referenceUrl}
                  </a>
                </div>
              ) : null}

              {item.status === "publicada" ? (
                <PublishedLink itemId={item.id} candidates={candidates} performance={performance} />
              ) : null}

              <div className="space-y-3 border-t border-mist pt-4">
                <GuionField label="Hook" value={item.hook} />
                <GuionField label="Desarrollo" value={item.development} />
                <GuionField label="CTA" value={item.cta} />
              </div>

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
                  disabled={!item.hook && !item.development && !item.cta}
                  className="inline-flex h-8 items-center gap-1.5 rounded-control bg-ink px-3 text-[12px] font-semibold text-paper transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
                >
                  <Play size={13} strokeWidth={1.75} aria-hidden="true" />
                  Grabar
                </button>
              </div>

              <DeleteButton item={item} onDeleted={onClose} />
            </div>
          )}
        </div>

        {!editing ? (
          <footer className="flex shrink-0 items-center justify-between border-t border-mist px-5 py-4">
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
              className="inline-flex h-8 items-center gap-1 rounded-control bg-ink px-3 text-[12px] font-semibold text-paper transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-30"
            >
              {nextLabel(item.status)}
              <ChevronRight size={14} strokeWidth={1.75} />
            </button>
          </footer>
        ) : null}
      </aside>

      {recording ? <ProductionTeleprompter item={item} onClose={() => setRecording(false)} /> : null}
    </>
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
        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted transition-colors hover:text-danger"
      >
        <Trash2 size={12} strokeWidth={1.75} aria-hidden="true" />
        Borrar la pieza
      </button>
    );
  }

  return (
    <div>
      <p className="font-support text-[12px] leading-5 text-graphite">
        Se borra de Zenovi con lo que hayas escrito acá.
        {item.linkedMediaId ? " El video sigue publicado en Instagram." : ""}
      </p>
      <div className="mt-1.5 flex items-center gap-2">
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

function EditForm({
  item,
  contentTypes,
  onDone,
}: {
  item: ContentItem;
  contentTypes: readonly string[];
  onDone: () => void;
}) {
  const [draft, setDraft] = useState({
    title: item.title,
    contentType: item.contentType,
    format: item.format,
    targetDate: item.targetDate ?? "",
    referenceUrl: item.referenceUrl,
    hook: item.hook,
    development: item.development,
    cta: item.cta,
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const update = (key: keyof typeof draft, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const updateFormat = (format: ContentFormat) =>
    setDraft((current) => ({ ...current, format }));

  function submit() {
    startTransition(async () => {
      const result = await updateContentItem(
        { status: "idle" },
        { id: item.id, ...draft, status: item.status, source: item.source, targetDate: draft.targetDate || null },
      );
      if (result.status === "saved") {
        onDone();
      } else {
        setError(result.message ?? "No pudimos guardar.");
      }
    });
  }

  return (
    <div className="space-y-3">
      <label className="block space-y-1.5">
        <span className="block text-sm font-medium text-ink">Título</span>
        <input
          className="w-full rounded-control border border-mist-strong bg-paper px-3 py-2 text-sm text-ink focus:border-graphite focus:outline-none"
          value={draft.title}
          onChange={(event) => update("title", event.target.value)}
          maxLength={200}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="block text-sm font-medium text-ink">Tipo</span>
          <input
            className="w-full rounded-control border border-mist-strong bg-paper px-3 py-2 text-sm text-ink focus:border-graphite focus:outline-none"
            value={draft.contentType}
            onChange={(event) => update("contentType", event.target.value)}
            maxLength={120}
            placeholder="Ej. atracción"
            list={contentTypes.length > 0 ? "sugerencias-tipo-detalle" : undefined}
          />
          {contentTypes.length > 0 ? (
            <datalist id="sugerencias-tipo-detalle">
              {contentTypes.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
          ) : null}
        </label>
        <label className="block space-y-1.5">
          <span className="block text-sm font-medium text-ink">Formato</span>
          <FormatSelect value={draft.format} onChange={updateFormat} />
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="block text-sm font-medium text-ink">Fecha objetivo</span>
        <DateField value={draft.targetDate || null} onChange={(value) => update("targetDate", value ?? "")} />
      </label>

      <label className="block space-y-1.5">
        <span className="block text-sm font-medium text-ink">Link de referencia</span>
        <input
          className="w-full rounded-control border border-mist-strong bg-paper px-3 py-2 text-sm text-ink focus:border-graphite focus:outline-none"
          value={draft.referenceUrl}
          onChange={(event) => update("referenceUrl", event.target.value)}
          maxLength={500}
          placeholder="https://www.instagram.com/reel/…"
        />
      </label>

      <GuionEditor label="Hook" value={draft.hook} onChange={(value) => update("hook", value)} />
      <GuionEditor label="Desarrollo" value={draft.development} onChange={(value) => update("development", value)} />
      <GuionEditor label="CTA" value={draft.cta} onChange={(value) => update("cta", value)} />

      {error ? <p className="text-xs text-danger" role="alert">{error}</p> : null}

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onDone}
          className="h-9 rounded-control px-4 text-sm font-medium text-graphite transition-colors hover:text-ink"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="h-9 rounded-control bg-ink px-4 text-sm font-semibold text-paper transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </div>
  );
}

function GuionEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-medium text-ink">{label}</span>
      <textarea
        className="w-full resize-y rounded-control border border-mist-strong bg-paper px-3 py-2 text-[15px] leading-6 text-ink focus:border-graphite focus:outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={label === "Desarrollo" ? 5 : 3}
      />
    </label>
  );
}

function nextLabel(status: ContentItem["status"]) {
  return status === "idea" ? "Al guión" : status === "guion" ? "A producción" : status === "produccion" ? "Publicar" : "";
}

function GuionField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-[10px] font-medium uppercase tracking-wide text-muted">{label}</span>
      <p className={`mt-0.5 text-[13px] leading-5 ${value ? "text-graphite" : "text-muted"}`}>
        {value || "—"}
      </p>
    </div>
  );
}

function Pill({ text, muted = false, status = false }: { text: string; muted?: boolean; status?: boolean }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[11px] ${
        status ? "border-mist-strong bg-control text-ink" : muted ? "border-mist text-muted" : "border-mist text-ink"
      }`}
    >
      {text}
    </span>
  );
}
