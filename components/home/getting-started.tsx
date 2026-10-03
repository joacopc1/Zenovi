"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowRight, Check, ListChecks } from "lucide-react";
import { CollapsibleSection } from "@/components/content/collapsible-section";
import type { ChecklistItem } from "@/lib/onboarding/checklist";
import { dismissGettingStarted } from "./getting-started-actions";

/**
 * Primeros pasos de una cuenta nueva, con la misma tarjeta plegable que análisis y
 * transcripción. Lo hecho se tilda en verde y una línea lo tacha de lado a lado; lo
 * pendiente lleva a donde se hace. "Saltar" la quita para siempre.
 */
export function GettingStarted({ items }: { items: ChecklistItem[] }) {
  const [skipped, setSkipped] = useState(false);
  // Saltar la quita para siempre: se pide confirmación ahí mismo, como al borrar un chat.
  const [confirming, setConfirming] = useState(false);
  const [, startTransition] = useTransition();
  const done = items.filter((item) => item.done).length;

  if (skipped) return null;

  return (
    <div className="mt-6">
      <CollapsibleSection
        sectionId="getting-started"
        title="Primeros pasos"
        icon={<ListChecks aria-hidden className="size-4" strokeWidth={1.7} />}
        actions={
          <div className="flex items-center gap-3">
            <span className="text-[12px] tabular-nums text-graphite">
              {done} de {items.length}
            </span>
            <span className="hidden h-1 w-24 overflow-hidden rounded-full bg-ink/[0.06] sm:block" aria-hidden="true">
              <span
                className="block h-full rounded-full bg-success transition-[width] duration-700 ease-out"
                style={{ width: `${(done / items.length) * 100}%` }}
              />
            </span>
            {confirming ? (
              <span className="flex items-center gap-1.5" role="group" aria-label="Confirmar quitar los primeros pasos">
                <span className="text-[12px] text-ink">¿Quitarlos? No vuelven a aparecer.</span>
                <button
                  type="button"
                  onClick={() => {
                    setSkipped(true);
                    startTransition(() => dismissGettingStarted());
                  }}
                  className="rounded-control bg-ink px-2.5 py-1 text-[12px] font-medium text-paper hover:bg-ink/85"
                >
                  Quitar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="rounded-control px-2 py-1 text-[12px] font-medium text-graphite hover:bg-ink/[0.045] hover:text-ink"
                >
                  Cancelar
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="rounded-control px-2 py-1 text-[12px] font-medium text-graphite transition-colors hover:bg-ink/[0.045] hover:text-ink"
              >
                Saltar
              </button>
            )}
          </div>
        }
      >
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {items.map((item, index) => (
            <li key={item.id} className="flex min-w-0">
              {item.done ? (
                <div className="flex w-full min-w-0 items-center gap-2.5 rounded-lg border border-success/25 bg-success/[0.04] px-3 py-2.5">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-success text-paper">
                    <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                  </span>
                  <span className="relative min-w-0 truncate text-[13px] text-muted">
                    {item.label}
                    <span className="checklist-strike absolute inset-x-0 top-1/2 h-px bg-muted" aria-hidden="true" />
                    <span className="sr-only"> (hecho)</span>
                  </span>
                </div>
              ) : (
                <Link
                  href={item.href}
                  className="group flex w-full min-w-0 items-center gap-2.5 rounded-lg border border-mist px-3 py-2.5 transition-colors hover:border-ink/25 hover:bg-ink/[0.02]"
                >
                  <span className="grid size-5 shrink-0 place-items-center rounded-full border-[1.5px] border-ink/20 text-[10px] font-semibold tabular-nums text-graphite">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">{item.label}</span>
                  <ArrowRight
                    className="size-3.5 shrink-0 text-ink/25 transition-all group-hover:translate-x-0.5 group-hover:text-ink"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </Link>
              )}
            </li>
          ))}
        </ol>
      </CollapsibleSection>
    </div>
  );
}
