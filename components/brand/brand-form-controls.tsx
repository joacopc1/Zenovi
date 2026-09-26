"use client";

import { useState } from "react";
import { X } from "lucide-react";

const INPUT_CLASS =
  "w-full rounded-control border border-mist-strong bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted/60 transition-colors focus:border-graphite focus:outline-none";

const LABEL_CLASS = "block text-sm font-medium text-ink";

export function TextField({
  label,
  value,
  onChange,
  hint,
  placeholder,
  maxLength,
  suggestions,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
  maxLength?: number;
  /** Valores que ya se usaron antes; el campo sigue siendo libre. */
  suggestions?: readonly string[];
}) {
  // El id se deriva de la etiqueta para que dos campos con sugerencias en la misma
  // pantalla no compartan lista, y sin useId, que cambiaría entre servidor y cliente.
  const listId = suggestions?.length ? `sugerencias-${slug(label)}` : undefined;

  return (
    <label className="block space-y-1.5">
      <span className={LABEL_CLASS}>{label}</span>
      {hint ? <span className="block text-xs leading-4 text-muted">{hint}</span> : null}
      <input
        className={INPUT_CLASS}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        list={listId}
      />
      {listId ? (
        <datalist id={listId}>
          {suggestions?.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      ) : null}
    </label>
  );
}

function slug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function TextArea({
  label,
  value,
  onChange,
  hint,
  placeholder,
  rows = 3,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}) {
  return (
    <label className="block space-y-1.5">
      <span className={LABEL_CLASS}>{label}</span>
      {hint ? <span className="block text-xs leading-4 text-muted">{hint}</span> : null}
      <textarea
        className={`${INPUT_CLASS} resize-y`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
      />
    </label>
  );
}

/**
 * Tag input: los valores viven como chips dentro del mismo campo, y el input sigue
 * a los chips en línea. Enter agrega; Backspace con el campo vacío borra el último;
 * cada chip se quita con su propia X. Un solo borde contiene todo, en vez de un input
 * separado de una lista de chips debajo.
 */
export function StringList({
  label,
  value,
  onChange,
  placeholder = "Agregar…",
  hint,
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  hint?: string;
}) {
  const [draft, setDraft] = useState("");

  function commit() {
    const item = draft.trim();
    if (item) onChange([...value, item]);
    setDraft("");
  }

  function removeAt(index: number) {
    onChange(value.filter((_, current) => current !== index));
  }

  return (
    <div className="space-y-1.5">
      <span className={LABEL_CLASS}>{label}</span>
      {hint ? <span className="block text-xs leading-4 text-muted">{hint}</span> : null}
      <div className="flex flex-wrap items-center gap-1.5 rounded-control border border-mist-strong bg-paper px-2 py-1.5 transition-colors focus-within:border-graphite">
        {value.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="inline-flex items-center gap-1 rounded-full border border-mist bg-canvas px-2.5 py-0.5 text-[13px] leading-5 text-ink"
          >
            {item}
            <button
              type="button"
              onClick={() => removeAt(index)}
              className="text-muted transition-colors hover:text-ink"
              aria-label={`Quitar ${item}`}
            >
              <X className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          className="min-w-[120px] flex-1 bg-transparent py-0.5 text-sm text-ink placeholder:text-muted/60 focus:outline-none"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit();
            } else if (event.key === "Backspace" && draft === "" && value.length > 0) {
              removeAt(value.length - 1);
            }
          }}
          placeholder={value.length === 0 ? placeholder : undefined}
          maxLength={80}
          aria-label={label}
        />
      </div>
    </div>
  );
}
