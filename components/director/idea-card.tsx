"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Check, LoaderIcon, Plus } from "lucide-react";
import { saveDirectorIdea } from "@/app/(dashboard)/director/actions";
import type { ProposedIdea } from "@/lib/director/idea-tool";
import { FORMAT_LABELS } from "@/lib/production/content";

/**
 * Lo que el Director deja para guardar en Producción. Una idea es una tarjeta liviana
 * con su botón; un guion, que ya está escrito en la respuesta, es sólo el botón. El clic
 * es la confirmación: el modelo nunca escribe en la base por su cuenta.
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
  const isScript = idea.tipo === "guion";

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveDirectorIdea(messageId, toolCallId);
      if (result.ok) setSaved(result.itemId);
      else setError(result.message);
    });
  }

  const saveButton = saved ? (
    <Link
      href="/production"
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-mist bg-paper px-3 py-1.5 text-[12px] font-medium text-ink hover:bg-canvas"
    >
      <Check aria-hidden="true" className="size-3.5" strokeWidth={2} />
      {isScript ? "Guardado" : "Guardada"} · Ver en Producción
    </Link>
  ) : (
    <button
      type="button"
      onClick={save}
      disabled={pending}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-mist bg-paper px-3 py-1.5 text-[12px] font-medium text-ink hover:bg-canvas disabled:opacity-60"
    >
      {pending ? <LoaderIcon aria-hidden="true" className="size-3.5 animate-spin" strokeWidth={2} /> : <Plus aria-hidden="true" className="size-3.5" strokeWidth={2} />}
      {isScript ? "Guardar guion en Producción" : "Guardar"}
    </button>
  );
  const errorLine = error ? <p role="alert" className="mt-2 text-[12px] text-danger">{error}</p> : null;

  // El guion ya está escrito en la respuesta: no se repite, queda sólo el botón.
  if (isScript) {
    return (
      <div className="my-3">
        {saveButton}
        {errorLine}
      </div>
    );
  }

  return (
    <div className="my-3 rounded-xl border border-mist bg-paper px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold leading-6 text-ink">{idea.titulo}</p>
          <p className="font-support text-[12px] text-muted">
            {FORMAT_LABELS[idea.formato] ?? "Reel"}
            {idea.tipo_de_contenido ? ` · ${idea.tipo_de_contenido}` : ""}
          </p>
        </div>
        {saveButton}
      </div>
      {idea.gancho ? (
        <p className="mt-2 text-[14px] leading-6 text-ink">
          <span className="font-medium">Gancho:</span> {idea.gancho}
        </p>
      ) : null}
      {idea.desarrollo ? <p className="mt-1 line-clamp-4 text-[14px] leading-6 text-ink/85">{idea.desarrollo}</p> : null}
      <p className="font-support mt-1.5 text-[13px] leading-5 text-graphite">{idea.porque}</p>
      {errorLine}
    </div>
  );
}
