"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowRight, Link2Off } from "lucide-react";
import { linkPublishedMedia, unlinkPublishedMedia } from "@/app/(dashboard)/production/actions";
import { PerformanceBadge } from "@/components/content/performance-badge";
import { getPerformanceVerdict } from "@/lib/content/metrics";
import { formatCompact } from "@/lib/format/numbers";
import type { PublishCandidate, PublishedPerformance } from "@/lib/data/production-links";

/**
 * El cierre del ciclo, dentro del detalle de una pieza publicada.
 *
 * Producción no repite lo que Contenido hace mejor: acá va el dato que justifica haber
 * planificado la pieza —cómo rindió contra las demás de su formato— y una puerta a la
 * vista completa, con sus métricas, su evolución y sus filtros.
 *
 * Cuando Zenovi no pudo reconocer sola cuál publicación es, lo dice en una línea y deja
 * elegir. No pregunta de entrada: hacer trabajo manual para ver un número que ya está en
 * Contenido no vale la pena, así que el selector espera a que alguien lo abra.
 */
export function PublishedLink({
  itemId,
  candidates,
  performance,
}: {
  itemId: string;
  candidates: PublishCandidate[];
  performance: PublishedPerformance | null;
}) {
  if (performance) return <Performance itemId={itemId} performance={performance} />;

  return <Unmatched itemId={itemId} candidates={candidates} />;
}

function Performance({
  itemId,
  performance,
}: {
  itemId: string;
  performance: PublishedPerformance;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function unlink() {
    startTransition(async () => {
      setError(null);
      const result = await unlinkPublishedMedia({ status: "idle" }, { id: itemId });
      if (result.status === "error") {
        setError(result.message ?? "No pudimos soltar el vínculo.");
      }
    });
  }

  return (
    <section className="border-t border-mist pt-4">
      <div className="flex items-start gap-3">
        <Thumbnail url={performance.thumbnailUrl} />
        <div className="min-w-0 flex-1">
          <p className="font-numeric text-[11px] text-muted">Salió el {performance.dateLabel}</p>

          {performance.multiplier === null ? (
            <p className="font-support mt-1 text-[12px] leading-5 text-muted">
              Todavía no hay suficientes piezas de este formato para compararla.
            </p>
          ) : (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <PerformanceBadge multiplier={performance.multiplier} />
              <p className="font-support text-[12px] leading-5 text-graphite">
                {getPerformanceVerdict(performance.multiplier)} la mediana de tus{" "}
                {performance.formatPlural}.
              </p>
            </div>
          )}
        </div>
      </div>

      <Link
        href={`/content/${performance.id}`}
        className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-control border border-mist-strong text-[12px] font-semibold text-ink transition-colors hover:bg-ink/[0.03]"
      >
        Ver los resultados
        <ArrowRight size={14} strokeWidth={1.75} aria-hidden="true" />
      </Link>

      <button
        type="button"
        onClick={unlink}
        disabled={pending}
        className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-muted transition-colors hover:text-ink disabled:opacity-50"
      >
        <Link2Off size={12} strokeWidth={1.75} aria-hidden="true" />
        No es esta publicación
      </button>

      {error ? (
        <p role="alert" className="mt-2 text-[12px] text-danger">
          {error}
        </p>
      ) : null}
    </section>
  );
}

function Unmatched({ itemId, candidates }: { itemId: string; candidates: PublishCandidate[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function choose(mediaId: string) {
    setChosen(mediaId);
    startTransition(async () => {
      setError(null);
      const result = await linkPublishedMedia({ status: "idle" }, { id: itemId, mediaId });
      if (result.status === "error") {
        setError(result.message ?? "No pudimos vincular la publicación.");
        setChosen(null);
      }
    });
  }

  if (candidates.length === 0) {
    return (
      <section className="border-t border-mist pt-4">
        <p className="font-support text-[12px] leading-5 text-muted">
          Cuando sincronices Instagram y aparezca la publicación, Zenovi la reconoce y te
          muestra acá cómo rindió.
        </p>
      </section>
    );
  }

  return (
    <section className="border-t border-mist pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-support text-[12px] leading-5 text-muted">
          No pudimos reconocer cuál publicación es.
        </p>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="text-[12px] font-medium text-ink underline decoration-ink/30 underline-offset-4 transition-colors hover:decoration-ink"
        >
          {open ? "Dejarlo así" : "Elegirla"}
        </button>
      </div>

      {open ? (
        <ul className="mt-3 space-y-1.5">
          {candidates.map((candidate) => (
            <li key={candidate.id}>
              <button
                type="button"
                onClick={() => choose(candidate.id)}
                disabled={pending}
                className="flex w-full items-center gap-3 rounded-control border border-mist p-2 text-left transition-colors hover:border-mist-strong hover:bg-canvas disabled:pointer-events-none disabled:opacity-50"
              >
                <Thumbnail url={candidate.thumbnailUrl} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-medium text-ink">
                    {candidate.caption?.trim() || "Sin texto"}
                  </span>
                  <span className="font-support mt-0.5 block text-[11px] text-muted">
                    {candidate.relativeDateLabel} · {formatCompact(candidate.views)} visualizaciones
                  </span>
                </span>
                {chosen === candidate.id ? (
                  <span className="font-support shrink-0 text-[11px] text-muted">Vinculando…</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? (
        <p role="alert" className="mt-2 text-[12px] text-danger">
          {error}
        </p>
      ) : null}
    </section>
  );
}

function Thumbnail({ url }: { url: string | null }) {
  if (!url) {
    return <div aria-hidden="true" className="size-12 shrink-0 rounded-control bg-canvas" />;
  }

  return (
    <Image
      src={url}
      alt=""
      width={48}
      height={48}
      className="size-12 shrink-0 rounded-control object-cover"
    />
  );
}
