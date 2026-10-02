"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Check, LoaderIcon, Plus } from "lucide-react";
import { saveDirectorIdea } from "@/app/(dashboard)/director/actions";
import type { ProposedIdea } from "@/lib/director/idea-tool";
import { FORMAT_LABELS } from "@/lib/production/content";

/**
 * Una idea que propuso el Director. Se guarda en Producción con un clic, que es la
 * confirmación: el modelo nunca escribe en la base por su cuenta.
 */
export function IdeaCard({
  messageId,
  toolCallId,
  idea,
  savedItemId,
}: {
  messageId: string;
  toolCallId: string;
  idea: ProposedIdea;
  /** Si ya se guardó, la tarjeta de Producción que se creó. */
  savedItemId: string | null;
}) {
  const [saved, setSaved] = useState(savedItemId);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveDirectorIdea(messageId, toolCallId);
      if (result.ok) setSaved(result.itemId);
      else setError(result.message);
    });
  }

  return (
    <div className="my-3 rounded-xl border border-mist bg-canvas/60 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
            Idea · {FORMAT_LABELS[idea.formato] ?? "Reel"}
            {idea.tipo_de_contenido ? ` · ${idea.tipo_de_contenido}` : ""}
          </p>
          <p className="mt-1 text-[15px] font-semibold leading-6 text-ink">{idea.titulo}</p>
        </div>
        {saved ? (
          <Link
            href="/production"
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-mist bg-paper px-3 py-1.5 text-[12px] font-medium text-ink hover:bg-canvas"
          >
            <Check className="size-3.5" strokeWidth={2} />
            Guardada · Ver en Producción
          </Link>
        ) : (
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-[12px] font-medium text-paper hover:bg-ink/85 disabled:opacity-60"
          >
            {pending ? <LoaderIcon className="size-3.5 animate-spin" strokeWidth={2} /> : <Plus className="size-3.5" strokeWidth={2} />}
            Guardar en Producción
          </button>
        )}
      </div>
      {idea.gancho ? (
        <p className="mt-2 text-[14px] leading-6 text-ink">
          <span className="font-medium">Gancho:</span> {idea.gancho}
        </p>
      ) : null}
      <p className="mt-1.5 text-[13px] leading-5 text-graphite">{idea.porque}</p>
      {error ? <p role="alert" className="mt-2 text-[12px] text-danger">{error}</p> : null}
    </div>
  );
}
