"use client";

import { useState, useTransition } from "react";
import { ROLE_OPTIONS, SOURCE_OPTIONS } from "@/lib/onboarding/steps";
import { saveOnboardingAbout } from "./actions";

/** Cada pregunta se responde con un toque; nada obliga a escribir ni a contestar. */
export function AboutForm() {
  const [role, setRole] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (skip: boolean) =>
    startTransition(() => saveOnboardingAbout(skip ? null : role, skip ? null : source));

  return (
    <div className="space-y-6">
      <ChoiceGroup legend="¿A qué te dedicás?" options={ROLE_OPTIONS} value={role} onChange={setRole} />
      <ChoiceGroup legend="¿Cómo conociste Zenovi?" options={SOURCE_OPTIONS} value={source} onChange={setSource} />

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => submit(false)}
          disabled={pending || (!role && !source)}
          className="h-12 w-full rounded-[12px] bg-ink px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {pending ? "Guardando…" : "Continuar"}
        </button>
        <button
          type="button"
          onClick={() => submit(true)}
          disabled={pending}
          className="block w-full text-center text-xs font-medium text-muted hover:text-ink"
        >
          Saltear
        </button>
      </div>
    </div>
  );
}

function ChoiceGroup({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: ReadonlyArray<{ id: string; label: string }>;
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-ink">{legend}</legend>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(selected ? null : option.id)}
              className={`rounded-full border px-3.5 py-2 text-[13px] transition-colors ${
                selected ? "border-ink bg-ink text-white" : "border-[#cacac8] bg-white text-ink hover:border-ink/40"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
