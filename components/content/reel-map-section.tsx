"use client";

import { useMemo, useState } from "react";
import { Map, Play } from "lucide-react";
import {
  formatSpan,
  isActionableAnalysis,
  type AnalysisMoment,
  type AnalysisState,
  type ReelMapRole,
  type ReelMapSegment,
} from "@/lib/content/analysis";
import { seekReel } from "@/lib/content/reel-seek";

const roleLabels: Record<ReelMapRole, string> = {
  hook: "Gancho",
  context: "Contexto",
  development: "Desarrollo",
  proof: "Prueba",
  transition: "Transición",
  cta: "CTA",
};

export function ReelMapSection({ state }: { state: AnalysisState }) {
  const map =
    state.status === "ready" && isActionableAnalysis(state.analysis)
      ? state.analysis.reelMap
      : [];

  return (
    <section className="rounded-card border border-mist bg-paper" aria-labelledby="reel-map-title">
      <header className="flex min-h-12 items-center justify-between gap-3 px-4 py-3">
        <h2 id="reel-map-title" className="flex items-center gap-2 text-[14px] font-semibold text-ink">
          <Map aria-hidden className="size-4" strokeWidth={1.7} />
          Mapa del Reel
        </h2>
        {map.length > 0 ? (
          <p className="font-support text-[11px] text-muted">Elegí un tramo para verlo</p>
        ) : null}
      </header>

      {map.length > 0 && state.status === "ready" ? (
        <ReelMap map={map} transcript={state.analysis.transcript} />
      ) : (
        <p className="border-t border-mist px-4 py-3 font-support text-[12px] leading-5 text-muted">
          {getEmptyMessage(state)}
        </p>
      )}
    </section>
  );
}

function ReelMap({
  map,
  transcript,
}: {
  map: ReelMapSegment[];
  transcript: AnalysisMoment[];
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = map[selectedIndex] ?? map[0];
  const spokenText = useMemo(
    () => getSpokenText(transcript, selected.fromMs, selected.toMs),
    [selected, transcript],
  );

  const selectSegment = (index: number) => {
    const segment = map[index];
    if (!segment) return;
    setSelectedIndex(index);
    seekReel(segment.fromMs);
  };

  return (
    <div className="border-t border-mist">
      <div className="overflow-x-auto">
        <div className="flex min-w-[680px] divide-x divide-mist border-b border-mist">
          {map.map((segment, index) => {
            const selectedSegment = index === selectedIndex;
            const duration = Math.max(segment.toMs - segment.fromMs, 1);

            return (
              <button
                type="button"
                key={`${segment.fromMs}-${segment.toMs}-${segment.label}`}
                aria-pressed={selectedSegment}
                onClick={() => selectSegment(index)}
                className="group min-w-[112px] basis-0 px-3 py-3 text-left transition-colors hover:bg-canvas aria-pressed:bg-canvas focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink"
                style={{ flexGrow: duration }}
              >
                <span className="font-support block text-[10px] font-semibold uppercase tracking-[0.055em] text-muted">
                  {roleLabels[segment.role]}
                </span>
                <span className="mt-1 block truncate text-[12px] font-semibold text-ink">
                  {segment.label}
                </span>
                <span className="font-numeric mt-1.5 flex items-center gap-1 text-[10px] font-medium text-graphite">
                  <Play aria-hidden className="size-2.5 fill-current" />
                  {formatSpan(segment.fromMs, segment.toMs)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 px-4 py-4 md:grid-cols-2 xl:grid-cols-[1.15fr_1fr_1.25fr]">
        <MapDetail label="Guion">
          <p>{spokenText || "Sin diálogo detectado en este tramo."}</p>
        </MapDetail>
        <MapDetail label="Qué se ve">
          <p>{selected.visual}</p>
          {selected.onScreenText ? (
            <p className="mt-2 text-graphite">
              <span className="font-medium text-ink/75">Texto en pantalla:</span>{" "}
              {selected.onScreenText}
            </p>
          ) : null}
        </MapDetail>
        <MapDetail label="Qué aprender">
          <p>{selected.finding}</p>
          <p className="mt-2 border-l-2 border-ink/15 pl-3 text-graphite">
            <span className="font-medium text-ink/75">Para próximos videos:</span>{" "}
            {selected.recommendation}
          </p>
        </MapDetail>
      </div>
    </div>
  );
}

function MapDetail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-support text-[10px] font-semibold uppercase tracking-[0.055em] text-muted">
        {label}
      </p>
      <div className="font-sans mt-1.5 text-[13px] font-normal leading-5 text-ink/85">
        {children}
      </div>
    </div>
  );
}

function getSpokenText(transcript: AnalysisMoment[], fromMs: number, toMs: number) {
  return transcript
    .filter((moment) => moment.atMs >= fromMs && moment.atMs < toMs)
    .map((moment) => moment.quote)
    .join(" ");
}

function getEmptyMessage(state: AnalysisState) {
  if (state.status === "ready") {
    return "Actualizá el análisis para generar el mapa temporal de este Reel.";
  }
  if (state.status === "queued" || state.status === "running") {
    return "El mapa aparecerá cuando termine el análisis.";
  }
  return "Se genera junto con el análisis y conecta cada tramo con el video.";
}
