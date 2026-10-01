import { Sparkles } from "lucide-react";
import {
  isStoryAnalysisOutdated,
  type StoryAnalysisState,
  type StorySequenceAnalysis,
} from "@/lib/content/story-analysis";
import { HelpHint } from "@/components/ui/help-hint";
import { AnalysisRequestButton } from "./analysis-request-button";
import { AnalysisDate, AnalysisFailed, AnalysisInProgress } from "./analysis-states";
import { CollapsibleSection } from "./collapsible-section";

/** Se comporta como el análisis de un Reel: se pide a mano, se abre y se cierra, y sólo ofrece actualizarse cuando quedó viejo. */
export function StoryAnalysisSection({
  state,
  mediaId,
  slideCount,
  blockedReason,
  readOnly = false,
}: {
  state: StoryAnalysisState;
  mediaId: string;
  slideCount: number;
  /** Por qué todavía no se puede pedir: faltan datos para que el análisis diga algo. */
  blockedReason: string | null;
  readOnly?: boolean;
}) {
  return (
    <CollapsibleSection
      sectionId={`story-analysis-${mediaId}`}
      title="Análisis de la secuencia"
      icon={<Sparkles aria-hidden className="size-4 text-ink" strokeWidth={1.75} />}
      help={<HelpHint text="Qué funcionó y qué cambiar en tus próximas secuencias." />}
      collapsible={state.status !== "not_requested"}
      actions={state.status === "ready" ? (
        <div className="flex flex-wrap items-center justify-end gap-3">
          <AnalysisDate completedAt={state.analysis.completedAt} />
          {!readOnly && !blockedReason && isStoryAnalysisOutdated(state.analysis, slideCount) ? (
            <AnalysisRequestButton subject="story" mediaId={mediaId} refresh />
          ) : null}
        </div>
      ) : state.status === "not_requested" && !readOnly ? (
        blockedReason ? (
          <p className="font-support max-w-sm text-right text-xs text-muted">{blockedReason}</p>
        ) : (
          <AnalysisRequestButton subject="story" mediaId={mediaId} />
        )
      ) : null}
    >
      {state.status === "queued" || state.status === "running" ? <AnalysisInProgress /> : null}
      {state.status === "failed" ? (
        <AnalysisFailed subject="story" mediaId={mediaId} reason={state.reason} canRetry={state.canRetry && !readOnly} />
      ) : null}
      {state.status === "ready" ? <StoryAnalysisDocument analysis={state.analysis} /> : null}
    </CollapsibleSection>
  );
}

function StoryAnalysisDocument({ analysis }: { analysis: StorySequenceAnalysis }) {
  return (
    <div>
      <div className="max-w-3xl">
        <h3 className="text-base font-semibold tracking-[-0.01em]">{analysis.diagnosis.verdict}</h3>
        <p className="font-support mt-2 text-[14px] leading-6 text-graphite">{analysis.diagnosis.explanation}</p>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {analysis.findings.map((finding, index) => (
          <article key={`${finding.title}-${index}`} className="border-t border-mist pt-4">
            <p className={`font-support text-[11px] font-semibold uppercase tracking-[0.08em] ${finding.kind === "strength" ? "text-success" : finding.kind === "friction" ? "text-danger" : "text-muted"}`}>
              {finding.kind === "strength" ? "Fortaleza" : finding.kind === "friction" ? "Fricción" : "Oportunidad"}
            </p>
            <h4 className="mt-1.5 text-[14px] font-semibold">{finding.title}</h4>
            <p className="font-support mt-2 text-[13px] leading-5 text-graphite">{finding.insight}</p>
            <p className="font-support mt-2 text-[12px] leading-5 text-muted">{finding.impact}</p>
            <p className="font-support mt-2 text-[11px] text-muted">Historias {finding.slideNumbers.join(", ")}</p>
          </article>
        ))}
      </div>

      <div className="mt-7 border-t border-mist pt-5">
        <h3 className="text-[15px] font-semibold">Para próximas secuencias</h3>
        <div className="mt-4 divide-y divide-mist">
          {analysis.actions.map((action, index) => (
            <article key={`${action.title}-${index}`} className="grid gap-3 py-4 first:pt-0 md:grid-cols-[110px_minmax(0,1fr)_minmax(0,1fr)]">
              <div>
                <span className={`font-support text-[11px] font-semibold uppercase tracking-[0.08em] ${action.kind === "keep" ? "text-success" : action.kind === "change" ? "text-danger" : "text-muted"}`}>
                  {action.kind === "keep" ? "Conservá" : action.kind === "change" ? "Cambiá" : "Probá"}
                </span>
                <p className="font-support mt-1 text-[11px] text-muted">Historias {action.slideNumbers.join(", ")}</p>
              </div>
              <div>
                <h4 className="text-[14px] font-semibold">{action.title}</h4>
                <p className="font-support mt-1.5 text-[13px] leading-5 text-graphite">{action.why}</p>
              </div>
              <div>
                <p className="font-support text-[13px] leading-5 text-graphite">{action.how}</p>
                <p className="font-support mt-2 text-[11px] text-muted">Medí: {action.metricToWatch}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
