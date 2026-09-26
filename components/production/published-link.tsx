"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowUpRight, Link2Off } from "lucide-react";
import { linkPublishedMedia, unlinkPublishedMedia } from "@/app/(dashboard)/production/actions";
import { PerformanceBadge } from "@/components/content/performance-badge";
import { getPerformanceVerdict } from "@/lib/content/metrics";
import { formatCompact } from "@/lib/format/numbers";
import type { PublishCandidate, PublishedPerformance } from "@/lib/data/production-links";

/**
 * El cierre del ciclo, dentro del detalle de una pieza publicada.
 *
 * Mientras Zenovi no sabe cuál de las publicaciones reales es esta idea, pregunta; una
 * vez que lo sabe, deja de preguntar y contesta cómo rindió. Son los dos estados de una
 * misma cosa, por eso viven en el mismo archivo.
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

  return <Picker itemId={itemId} candidates={candidates} />;
}

function Picker({ itemId, candidates }: { itemId: string; candidates: PublishCandidate[] }) {
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

  return (
    <section className="border-t border-mist pt-4">
      <h3 className="text-[13px] font-semibold text-ink">¿Cuál de tus publicaciones es?</h3>
      <p className="font-support mt-1 text-[12px] leading-5 text-muted">
        Cuando la reconozcas, Zenovi puede decirte cómo rindió contra el resto de tu contenido.
      </p>

      {candidates.length === 0 ? (
        <p className="font-support mt-3 rounded-control border border-dashed border-mist px-3 py-3 text-[12px] leading-5 text-muted">
          Todavía no encontramos publicaciones de este formato en tu cuenta. Sincronizá
          Instagram después de subirla y aparece acá.
        </p>
      ) : (
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
      )}

      {error ? (
        <p role="alert" className="mt-2 text-[12px] text-danger">
          {error}
        </p>
      ) : null}
    </section>
  );
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
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[13px] font-semibold text-ink">Cómo rindió</h3>
        <button
          type="button"
          onClick={unlink}
          disabled={pending}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-muted transition-colors hover:text-ink disabled:opacity-50"
        >
          <Link2Off size={12} strokeWidth={1.75} aria-hidden="true" />
          No es esta
        </button>
      </div>

      <div className="mt-3 flex items-start gap-3">
        <Thumbnail url={performance.thumbnailUrl} />
        <div className="min-w-0 flex-1">
          <p className="font-numeric text-[12px] text-muted">
            Publicada el {performance.dateLabel}
          </p>
          {performance.multiplier === null ? (
            <p className="font-support mt-1 text-[12px] leading-5 text-muted">
              Todavía no hay suficientes piezas de este formato para compararla.
            </p>
          ) : (
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <PerformanceBadge multiplier={performance.multiplier} />
              <p className="font-support text-[12px] leading-5 text-graphite">
                {getPerformanceVerdict(performance.multiplier)} la mediana de tus {performance.formatPlural}.
                {performance.rank
                  ? ` Es la número ${performance.rank.position} de ${performance.rank.total}.`
                  : ""}
              </p>
            </div>
          )}
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5">
        <Metric label="Visualizaciones" value={performance.views} />
        <Metric label="Interacciones" value={performance.interactions} />
        <Metric label="Alcance" value={performance.reach} />
        <Metric label="Guardados" value={performance.saves} />
      </dl>

      <div className="mt-3 flex items-center gap-2">
        <Link
          href={`/content/${performance.id}`}
          className="inline-flex h-8 flex-1 items-center justify-center rounded-control border border-mist-strong text-[12px] font-medium text-ink transition-colors hover:bg-ink/[0.03]"
        >
          Ver la pieza
        </Link>
        {performance.permalink ? (
          <a
            href={performance.permalink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-1 rounded-control border border-mist px-3 text-[12px] font-medium text-graphite transition-colors hover:border-mist-strong hover:text-ink"
          >
            Instagram
            <ArrowUpRight size={13} strokeWidth={1.75} aria-hidden="true" />
          </a>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-[12px] text-danger">
          {error}
        </p>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <dt className="font-support text-[11px] text-muted">{label}</dt>
      <dd className="font-numeric text-[15px] font-semibold text-ink">{formatCompact(value)}</dd>
    </div>
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
