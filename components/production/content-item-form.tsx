"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteContentItem, updateContentItem } from "@/app/(dashboard)/production/actions";
import type { ContentFormat } from "@/lib/production/content";
import type { ContentItem } from "@/lib/data/production";
import { DateField } from "./date-field";
import { FormatSelect } from "./format-select";

/**
 * Editar una pieza que ya existe.
 *
 * Vivía dentro del panel de detalle, que terminó con cuatro responsabilidades en un solo
 * archivo. Es un formulario: merece su archivo y su estado propio.
 */
export function ContentItemForm({
  item,
  contentTypes,
  scope = "all",
  onDelete,
  onDone,
}: {
  item: ContentItem;
  contentTypes: readonly string[];
  /** `script` abre sólo el guion: es lo que se edita desde la card del guion. */
  scope?: "all" | "script";
  /** Qué hacer cuando la pieza se borró; el panel que la mostraba tiene que cerrarse. */
  onDelete: () => void;
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

  const update = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  function submit() {
    startTransition(async () => {
      const result = await updateContentItem(
        { status: "idle" },
        {
          id: item.id,
          ...draft,
          status: item.status,
          source: item.source,
          targetDate: draft.targetDate || null,
        },
      );
      if (result.status === "saved") onDone();
      else setError(result.message ?? "No pudimos guardar.");
    });
  }

  const onlyScript = scope === "script";

  return (
    <div className="space-y-3.5">
      {/* Editar sólo el guion existe porque es lo que más se retoca: entrar a cambiar una
          frase del hook no tendría por qué poner delante el título, el tipo y la fecha. */}
      {onlyScript ? null : (
        <>
          <Field label="Título">
            <input
              className={INPUT}
              value={draft.title}
              onChange={(event) => update("title", event.target.value)}
              maxLength={200}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo">
              <input
                className={INPUT}
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
            </Field>
            <Field label="Formato">
              <FormatSelect
                value={draft.format}
                onChange={(format: ContentFormat) => update("format", format)}
              />
            </Field>
          </div>

          <Field label="Fecha objetivo">
            <DateField
              value={draft.targetDate || null}
              onChange={(value) => update("targetDate", value ?? "")}
            />
          </Field>
        </>
      )}

      <div className="space-y-3 rounded-card border border-mist p-4">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink">
            Guion
          </span>
          <span aria-hidden="true" className="h-px flex-1 bg-mist" />
        </div>
        <ScriptField
          label="Hook"
          value={draft.hook}
          rows={2}
          onChange={(value) => update("hook", value)}
        />
        <ScriptField
          label="Desarrollo"
          value={draft.development}
          rows={5}
          onChange={(value) => update("development", value)}
        />
        <ScriptField
          label="CTA"
          value={draft.cta}
          rows={2}
          onChange={(value) => update("cta", value)}
        />
      </div>

      {/* Después del guion: la referencia es de dónde salió la idea, no parte de lo que se
          va a decir en cámara. */}
      {onlyScript ? null : (
        <Field label="Link de referencia">
          <input
            className={INPUT}
            value={draft.referenceUrl}
            onChange={(event) => update("referenceUrl", event.target.value)}
            maxLength={500}
            placeholder="https://www.instagram.com/reel/…"
          />
        </Field>
      )}

      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3 pt-2">
        {/* Borrar vive acá y no en la vista de lectura: es una acción de formulario, y
            acompañada de Cancelar y Guardar se entiende que es parte de decidir qué hacer
            con la pieza, no algo que uno se encuentra mientras la lee. */}
        {onlyScript ? null : <DeleteButton item={item} onDeleted={onDelete} />}
        <button
          type="button"
          onClick={onDone}
          className="ml-auto h-8 rounded-control px-3 text-[12px] font-medium text-graphite transition-colors hover:text-ink"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="h-8 rounded-control bg-ink px-3 text-[12px] font-semibold text-paper transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </div>
  );
}

const INPUT =
  "w-full rounded-control border border-mist bg-paper px-2.5 py-1.5 text-[13px] text-ink transition-colors focus:border-mist-strong focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-[12px] font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

function ScriptField({
  label,
  value,
  rows,
  onChange,
}: {
  label: string;
  value: string;
  rows: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-[10px] font-semibold uppercase tracking-wide text-graphite">
        {label}
      </span>
      <textarea
        className="w-full resize-y rounded-control border border-mist bg-paper px-2.5 py-2 text-[14px] leading-6 text-ink transition-colors focus:border-mist-strong focus:outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
      />
    </label>
  );
}

/**
 * Borrar la pieza, con la confirmación en el mismo botón.
 *
 * El primer click descubre la advertencia y el segundo borra: para una acción de esta
 * escala alcanza y no interrumpe con un diálogo. Se aclara qué se pierde —sólo lo que se
 * escribió en Zenovi— porque la duda al borrar una pieza publicada es si también le pasa
 * algo al video, y no le pasa nada.
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
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted transition-colors hover:text-danger"
      >
        <Trash2 size={13} strokeWidth={1.75} aria-hidden="true" />
        Eliminar
      </button>
    );
  }

  return (
    <div className="flex-1">
      <p className="font-support text-[11px] leading-4 text-graphite">
        Se borra de Zenovi con lo que hayas escrito.
        {item.linkedMediaId ? " El video sigue publicado en Instagram." : ""}
      </p>
      <div className="mt-1.5 flex items-center gap-2">
        <button
          type="button"
          disabled={pending}
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
          className="h-7 rounded-control bg-danger px-2.5 text-[11px] font-semibold text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Borrando…" : "Borrar"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="h-7 rounded-control px-2 text-[11px] font-medium text-graphite transition-colors hover:text-ink"
        >
          Cancelar
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-1 text-[11px] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
