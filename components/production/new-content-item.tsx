"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { createContentItem } from "@/app/(dashboard)/production/actions";
import { emptyContentItem, type ContentItemDraft } from "@/lib/production/content";
import { TextArea, TextField } from "@/components/brand/brand-form-controls";
import { DateField } from "./date-field";
import { FormatSelect } from "./format-select";

export function NewContentItem({
  initialGuion = false,
  contentTypes = [],
  onClose,
}: {
  initialGuion?: boolean;
  /** Los tipos que el creador ya usó, para no reinventar una categoría por pieza. */
  contentTypes?: readonly string[];
  onClose: () => void;
}) {
  const [isGuion, setIsGuion] = useState(initialGuion);
  const [draft, setDraft] = useState<ContentItemDraft>(() => ({
    ...emptyContentItem(),
    status: initialGuion ? "guion" : "idea",
  }));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const update = <K extends keyof ContentItemDraft>(key: K, value: ContentItemDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  function toggleGuion(next: boolean) {
    setIsGuion(next);
    setDraft((current) => ({ ...current, status: next ? "guion" : "idea" }));
  }

  function submit() {
    startTransition(async () => {
      const result = await createContentItem({ status: "idle" }, { ...draft, status: isGuion ? "guion" : "idea" });
      if (result.status === "saved") {
        onClose();
      } else {
        // El primer error de campo dice qué falta; el genérico sólo si no hay ninguno.
        const fieldError = Object.values(result.errors ?? {})[0];
        setError(fieldError ?? result.message ?? "No pudimos guardar la idea.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <TextField
        label="Título"
        value={draft.title}
        onChange={(value) => update("title", value)}
        placeholder="Ej. 3 mitos sobre llenar tu agenda"
        maxLength={200}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <TextField
            label="Tipo de contenido"
            value={draft.contentType}
            onChange={(value) => update("contentType", value)}
            placeholder="Escribí el tuyo"
            maxLength={120}
            suggestions={contentTypes}
          />
          {/* A la vista y no sólo en el desplegable del navegador: una sugerencia que hay
              que descubrir haciendo click no existe. Se muestran mientras el campo está
              vacío y desaparecen apenas escribe, que es cuando estorban. */}
          {draft.contentType.trim().length === 0 && contentTypes.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {contentTypes.slice(0, 7).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => update("contentType", suggestion)}
                  className="h-6 rounded-full border border-mist px-2 text-[11px] font-medium text-graphite transition-colors hover:border-mist-strong hover:text-ink"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <label className="block space-y-1.5">
          <span className="block text-sm font-medium text-ink">Formato</span>
          <FormatSelect value={draft.format} onChange={(value) => update("format", value)} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="block text-sm font-medium text-ink">Fecha objetivo</span>
          <DateField value={draft.targetDate} onChange={(value) => update("targetDate", value)} />
        </label>
        <TextField
          label="Link de referencia"
          value={draft.referenceUrl}
          onChange={(value) => update("referenceUrl", value)}
          placeholder="https://www.instagram.com/reel/…"
          maxLength={500}
        />
      </div>

      <button
        type="button"
        onClick={() => toggleGuion(!isGuion)}
        role="switch"
        aria-checked={isGuion}
        className="flex w-full items-center justify-between rounded-control border border-mist-strong bg-paper px-3 py-2.5 text-left transition-colors hover:bg-ink/[0.02]"
      >
        <span className="text-sm font-medium text-ink">Guion</span>
        <span
          aria-hidden="true"
          className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors ${
            isGuion ? "border-ink bg-ink" : "border-mist-strong bg-canvas"
          }`}
        >
          <span
            className={`absolute top-0.5 size-4 rounded-full transition-[left] ${
              isGuion ? "left-[18px] bg-paper" : "left-0.5 bg-paper"
            }`}
          />
        </span>
      </button>

      {isGuion ? (
        <div className="space-y-3 rounded-card border border-mist p-4">
          <TextArea
            label="Hook"
            value={draft.hook}
            onChange={(value) => update("hook", value)}
            placeholder="La primera frase que engancha."
            rows={2}
          />
          <TextArea
            label="Desarrollo"
            value={draft.development}
            onChange={(value) => update("development", value)}
            placeholder="El cuerpo del guion."
            rows={3}
          />
          <TextArea
            label="CTA"
            value={draft.cta}
            onChange={(value) => update("cta", value)}
            placeholder="La acción que querés que haga la audiencia."
            rows={2}
          />
        </div>
      ) : null}

      {error ? <p className="text-xs text-danger" role="alert">{error}</p> : null}

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
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
          {pending ? "Guardando…" : "Crear"}
        </button>
      </div>
    </div>
  );
}

export function NewContentItemDialog({
  initialGuion = false,
  contentTypes = [],
  onClose,
}: {
  initialGuion?: boolean;
  contentTypes?: readonly string[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/25 p-4">
      <div className="max-h-[90dvh] w-[min(36rem,100%)] overflow-y-auto rounded-card border border-mist bg-paper p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-[-0.01em]">Nueva pieza</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-7 place-items-center rounded-control text-graphite transition-colors hover:text-ink"
            aria-label="Cerrar"
          >
            <X size={15} strokeWidth={1.75} />
          </button>
        </div>
        <NewContentItem initialGuion={initialGuion} contentTypes={contentTypes} onClose={onClose} />
      </div>
    </div>
  );
}
