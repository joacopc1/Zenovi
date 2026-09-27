"use client";

import { useState, useTransition } from "react";
import { updateContentItem } from "@/app/(dashboard)/production/actions";
import { CONTENT_OBJECTIVES, OBJECTIVE_COPY } from "@/lib/production/objective";
import type { ContentObjective } from "@/lib/production/objective";
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
  onDone,
}: {
  item: ContentItem;
  contentTypes: readonly string[];
  onDone: () => void;
}) {
  const [draft, setDraft] = useState({
    title: item.title,
    contentType: item.contentType,
    objective: item.objective,
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

  return (
    <div className="space-y-4">
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

      <ObjectiveField
        value={draft.objective}
        onChange={(objective) => update("objective", objective)}
      />

      <Field label="Fecha objetivo">
        <DateField
          value={draft.targetDate || null}
          onChange={(value) => update("targetDate", value ?? "")}
        />
      </Field>

      <Field label="Link de referencia">
        <input
          className={INPUT}
          value={draft.referenceUrl}
          onChange={(event) => update("referenceUrl", event.target.value)}
          maxLength={500}
          placeholder="https://www.instagram.com/reel/…"
        />
      </Field>

      <div className="space-y-3 rounded-card border border-mist p-4">
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

      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-3 pt-2">
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

/**
 * Para qué se hace la pieza.
 *
 * Se elige entre cuatro porque son los cuatro que Zenovi después puede medir. Se puede
 * dejar sin elegir: mientras no haya objetivo, la pieza se juzga por visualizaciones, que
 * es lo que pasaba antes de que este campo existiera.
 */
function ObjectiveField({
  value,
  onChange,
}: {
  value: ContentObjective | null;
  onChange: (value: ContentObjective | null) => void;
}) {
  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-medium text-ink">¿Para qué la hacés?</span>
      <p className="font-support text-xs leading-4 text-muted">
        Decide contra qué número se mide cuando se publique.
      </p>
      <div className="flex flex-wrap gap-1.5 pt-0.5">
        {CONTENT_OBJECTIVES.map((objective) => {
          const selected = value === objective;
          return (
            <button
              key={objective}
              type="button"
              onClick={() => onChange(selected ? null : objective)}
              aria-pressed={selected}
              title={OBJECTIVE_COPY[objective].hint}
              className={`h-7 rounded-full border px-2.5 text-[11px] font-medium transition-colors ${
                selected
                  ? "border-ink bg-ink text-paper"
                  : "border-mist text-graphite hover:border-mist-strong hover:text-ink"
              }`}
            >
              {OBJECTIVE_COPY[objective].label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const INPUT =
  "w-full rounded-control border border-mist-strong bg-paper px-3 py-2 text-sm text-ink transition-colors focus:border-graphite focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-medium text-ink">{label}</span>
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
      <span className="block text-[10px] font-medium uppercase tracking-wide text-muted">
        {label}
      </span>
      <textarea
        className="w-full resize-y rounded-control border border-mist-strong bg-paper px-3 py-2 text-[15px] leading-6 text-ink transition-colors focus:border-graphite focus:outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
      />
    </label>
  );
}
