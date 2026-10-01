import {
  AudioLines,
  CircleAlert,
  Gauge,
  Lightbulb,
  RotateCcw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { AnalysisMomentLinks } from "@/components/content/analysis-evidence";
import { AnalysisRequestButton } from "@/components/content/analysis-request-button";
import { AnalysisDate, AnalysisFailed, AnalysisInProgress } from "@/components/content/analysis-states";
import { CollapsibleSection } from "@/components/content/collapsible-section";
import { HelpHint } from "@/components/ui/help-hint";
import {
  formatSpan,
  estimateSpeakingPaceWpm,
  isActionableAnalysis,
  isAnalysisOutdated,
  type ActionKind,
  type ActionPlan as ActionPlanData,
  type ActionableRecommendation,
  type ActionableReelAnalysis,
  type AnalysisConfidence,
  type AnalysisState,
  type DecisionFinding,
  type ExecutionFinding,
  type LegacyReelAnalysis,
  type ReelAnalysis,
} from "@/lib/content/analysis";

export function AnalysisSection({
  state,
  mediaId,
  mediaAvailable,
  blockedReason,
}: {
  state: AnalysisState;
  mediaId: string;
  mediaAvailable: boolean;
  /** Por qué todavía no se puede pedir: faltan datos para que el análisis diga algo. */
  blockedReason: string | null;
}) {
  const hasContent = state.status !== "not_requested" || !mediaAvailable;

  return (
    <CollapsibleSection
      sectionId={`analysis-${mediaId}`}
      title="Análisis"
      icon={<Sparkles aria-hidden className="size-4 text-ink" strokeWidth={1.75} />}
      help={<HelpHint text="Explica qué pudo ayudar o frenar el rendimiento y lo convierte en aprendizajes aplicables a futuros contenidos. Las causas no comprobables se marcan como hipótesis." />}
      collapsible={hasContent}
      actions={state.status === "ready" ? (
          <div className="flex flex-wrap items-center justify-end gap-3">
            <AnalysisDate completedAt={state.analysis.completedAt} />
            {isAnalysisOutdated(state.analysis) && mediaAvailable && !blockedReason ? (
              <AnalysisRequestButton subject="reel" mediaId={mediaId} refresh />
            ) : null}
          </div>
        ) : state.status === "not_requested" && mediaAvailable ? (
          blockedReason ? (
            <p className="font-support max-w-sm text-right text-xs text-muted">{blockedReason}</p>
          ) : (
            <AnalysisRequestButton subject="reel" mediaId={mediaId} />
          )
        ) : null}
    >
      {hasContent ? (
        <>
          {state.status === "not_requested" ? <Unavailable /> : null}
          {state.status === "queued" || state.status === "running" ? <AnalysisInProgress /> : null}
          {state.status === "failed" ? (
            <AnalysisFailed subject="reel" mediaId={mediaId} reason={state.reason} canRetry={state.canRetry && mediaAvailable} />
          ) : null}
          {state.status === "ready" ? <Ready analysis={state.analysis} /> : null}
        </>
      ) : null}
    </CollapsibleSection>
  );
}

function Unavailable() {
  return (
    <p className="font-support text-[13px] font-medium text-graphite">
      Esperando que Instagram vuelva a entregar el archivo del video.
    </p>
  );
}

function Ready({ analysis }: { analysis: ReelAnalysis }) {
  return isActionableAnalysis(analysis)
    ? <ActionableReady analysis={analysis} />
    : <LegacyReady analysis={analysis} />;
}

function ActionableReady({ analysis }: { analysis: ActionableReelAnalysis }) {
  return (
    <div>
      <section className="max-w-4xl" aria-labelledby="quick-read-title">
        <p className="font-support text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
          Lectura rápida
        </p>
        <h3 id="quick-read-title" className="mt-2 text-[18px] font-semibold tracking-[-0.02em] text-ink">
          {analysis.performance.verdict}
        </h3>
        <p className="font-sans mt-2 text-[14px] font-normal leading-6 text-ink/80">
          {analysis.performance.explanation}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Confidence value={analysis.performance.confidence} />
          <AnalysisMomentLinks moments={analysis.performance.evidence} />
        </div>
      </section>

      <ActionPlan plan={analysis.actionPlan} />
      <ExecutionReview analysis={analysis} />
      <Findings findings={analysis.findings} />
      <Attention hypotheses={analysis.attentionHypotheses} />
      {analysis.reversionIdeas.length > 0 ? <ReversionIdeas ideas={analysis.reversionIdeas} /> : null}
    </div>
  );
}

const ACTION_KINDS: ActionKind[] = ["keep", "change", "test"];

function ActionPlan({ plan }: { plan: ActionPlanData }) {
  return (
    <section className="mt-6 border-t border-mist pt-5" aria-labelledby="action-plan-title">
      <div className="flex items-center gap-2">
        <Lightbulb aria-hidden className="size-4" strokeWidth={1.7} />
        <h3 id="action-plan-title" className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
          Qué llevarte a tus próximos videos
        </h3>
      </div>
      <div className="mt-4 divide-y divide-mist border-y border-mist">
        {ACTION_KINDS.flatMap((kind) =>
          plan[kind].map((action, index) => (
            <ActionRow key={`${kind}-${action.title}-${index}`} kind={kind} action={action} />
          )),
        )}
      </div>
    </section>
  );
}

function ActionRow({ kind, action }: { kind: ActionKind; action: ActionableRecommendation }) {
  return (
    <article className="grid gap-4 py-5 lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-6">
      <div>
        <ActionBadge kind={kind} />
        <h4 className="mt-2 text-[14px] font-semibold leading-5 text-ink">{action.title}</h4>
        <span className="font-numeric mt-2 block text-[11px] font-medium text-ink/65">
          {formatSpan(action.fromMs, action.toMs)}
        </span>
        <AnalysisMomentLinks moments={action.evidence} />
      </div>
      <dl className="grid gap-4 sm:grid-cols-3">
        <ActionDetail label="Por qué" value={action.why} />
        <ActionDetail label="Cómo aplicarlo en otros videos" value={action.how} />
        <ActionDetail label="Qué medir" value={action.metricToWatch} />
      </dl>
    </article>
  );
}

const executionLabels: Record<ExecutionFinding["dimension"], string> = {
  voice: "Voz y ritmo",
  body: "Postura y presencia",
  visual: "Imagen y entorno",
  editing: "Edición",
  sound: "Sonido",
};

function ExecutionReview({ analysis }: { analysis: ActionableReelAnalysis }) {
  const pace = estimateSpeakingPaceWpm(analysis.transcript);
  if (analysis.executionReview.length === 0 && pace === null) return null;

  return (
    <section className="border-t border-mist py-5" aria-labelledby="execution-title">
      <div className="flex items-center gap-2">
        <AudioLines aria-hidden className="size-4 text-ink" strokeWidth={1.7} />
        <h3 id="execution-title" className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
          Presentación y producción
        </h3>
        <HelpHint text="Revisa voz, ritmo, postura, imagen, edición y sonido. Sólo destaca aspectos que puedan cambiar una decisión para futuros videos." />
      </div>
      {pace !== null ? (
        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-y border-mist py-3">
          <span className="font-support text-[13px] font-medium text-ink">Ritmo de habla</span>
          <span className="font-support text-[13px] text-graphite">
            <strong className="font-numeric font-semibold text-ink">{pace}</strong>{" "}
            palabras por minuto · estimado
          </span>
        </div>
      ) : null}
      <div className="divide-y divide-mist">
        {analysis.executionReview.map((item, index) => (
          <article key={`${item.dimension}-${item.title}-${index}`} className="grid gap-3 py-4 md:grid-cols-[180px_minmax(0,1fr)] md:gap-6">
            <div>
              <p className="font-support text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">
                {executionLabels[item.dimension]}
              </p>
              <h4 className="mt-1.5 text-[13px] font-semibold text-ink">{item.title}</h4>
              <AnalysisMomentLinks moments={item.evidence} />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <ActionDetail label="Qué observamos" value={item.observation} />
              <ActionDetail label="Qué efecto puede tener" value={item.impact} />
              <ActionDetail label="Cómo mejorarlo" value={item.recommendation} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ActionDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-support text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">{label}</dt>
      <dd className="font-sans mt-1.5 text-[13px] font-normal leading-6 text-ink/80">{value}</dd>
    </div>
  );
}

function Findings({ findings }: { findings: DecisionFinding[] }) {
  return (
    <section className="border-t border-mist py-5" aria-labelledby="findings-title">
      <div className="flex items-center gap-2">
        <TrendingUp aria-hidden className="size-4" strokeWidth={1.7} />
        <h3 id="findings-title" className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
          Qué ayudó y qué frenó
        </h3>
      </div>
      <div className="mt-4 grid gap-x-8 gap-y-5 md:grid-cols-2">
        {findings.map((finding, index) => (
          <FindingRow key={`${finding.title}-${index}`} finding={finding} />
        ))}
      </div>
    </section>
  );
}

function FindingRow({ finding }: { finding: DecisionFinding }) {
  const label = finding.kind === "strength" ? "Fortaleza" : finding.kind === "friction" ? "Fricción" : "Oportunidad";
  const color = finding.kind === "strength" ? "text-success" : finding.kind === "friction" ? "text-danger" : "text-warning";
  return (
    <article>
      <p className={`font-support text-[11px] font-semibold uppercase tracking-[0.05em] ${color}`}>{label}</p>
      <h4 className="mt-1.5 text-[14px] font-semibold text-ink">{finding.title}</h4>
      <p className="font-sans mt-1.5 text-[13px] font-normal leading-6 text-ink/80">{finding.insight}</p>
      <p className="font-sans mt-2 text-[12px] font-medium leading-5 text-graphite">
        Por qué importa: {finding.impact}
      </p>
      <AnalysisMomentLinks moments={finding.evidence} />
    </article>
  );
}

function Attention({ hypotheses }: { hypotheses: ActionableReelAnalysis["attentionHypotheses"] }) {
  return (
    <section className="border-t border-mist py-5" aria-labelledby="attention-title">
      <div className="flex items-center gap-2">
        <Gauge aria-hidden className="size-4" strokeWidth={1.7} />
        <h3 id="attention-title" className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
          Dónde puede perder atención
        </h3>
        <HelpHint text="Instagram no entrega una curva por segundo. Zenovi combina omisión, tiempo medio y señales del video para proponer zonas probables de fricción." />
      </div>
      <div className="mt-4 divide-y divide-mist">
        {hypotheses.map((item, index) => (
          <article key={`${item.title}-${index}`} className="grid gap-3 py-4 first:pt-0 md:grid-cols-[190px_minmax(0,1fr)] md:gap-5">
            <div>
              <h4 className="text-[13px] font-semibold text-ink">{item.title}</h4>
              <Confidence value={item.confidence} />
            </div>
            <div>
              <p className="font-sans text-[13px] font-normal leading-6 text-ink/80">{item.hypothesis}</p>
              <AnalysisMomentLinks moments={item.evidence} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ReversionIdeas({ ideas }: { ideas: ActionableReelAnalysis["reversionIdeas"] }) {
  return (
    <section className="border-t border-mist py-5" aria-labelledby="reversion-title">
      <div className="flex items-center gap-2">
        <RotateCcw aria-hidden className="size-4 text-ink" strokeWidth={1.7} />
        <h3 id="reversion-title" className="text-[15px] font-semibold text-ink">
          Si decidís reversionar esta pieza
        </h3>
      </div>
      <div className="mt-4 divide-y divide-mist">
        {ideas.map((idea, index) => (
          <article key={`${idea.title}-${index}`} className="grid gap-3 py-4 first:pt-0 md:grid-cols-[210px_minmax(0,1fr)] md:gap-6">
            <div>
              <h4 className="text-[13px] font-semibold text-ink">{idea.title}</h4>
              <AnalysisMomentLinks moments={idea.evidence} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <ActionDetail label="Cambio puntual" value={idea.change} />
              <ActionDetail label="Por qué puede valer la pena" value={idea.why} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function LegacyReady({ analysis }: { analysis: LegacyReelAnalysis }) {
  return (
    <div>
      <div className="flex items-start gap-3 rounded-control bg-canvas px-4 py-3">
        <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-graphite" strokeWidth={1.7} />
        <p className="font-sans text-[13px] font-normal leading-6 text-graphite">
          Este resultado pertenece al análisis anterior. Actualizalo para obtener diagnóstico,
          acciones por momento y una métrica concreta para validar cada cambio.
        </p>
      </div>
      <section className="mt-5" aria-labelledby="legacy-actions-title">
        <h3 id="legacy-actions-title" className="text-[15px] font-semibold text-ink">Aprendizajes del análisis anterior</h3>
        <ul className="mt-3 divide-y divide-mist border-y border-mist">
          {analysis.recommendations.map((item) => (
            <li key={item.text} className="grid gap-2 py-3 sm:grid-cols-[96px_minmax(0,1fr)]">
              <ActionBadge kind={item.kind} />
              <span className="font-sans text-[13px] font-normal leading-6 text-ink/80">{item.text}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ActionBadge({ kind }: { kind: ActionKind }) {
  const classes = kind === "keep"
    ? "border-success/35 bg-success/10 text-success"
    : kind === "change"
      ? "border-danger/35 bg-danger/10 text-danger"
      : "border-warning/40 bg-warning/10 text-warning";
  return (
    <span className={`font-support inline-flex w-fit rounded-[6px] border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] ${classes}`}>
      {kind === "keep" ? "Conservá" : kind === "change" ? "Cambiá" : "Probá"}
    </span>
  );
}

function Confidence({ value }: { value: AnalysisConfidence }) {
  return (
    <span className="font-support mt-2 inline-flex text-[11px] font-medium text-muted">
      Confianza {value === "high" ? "alta" : value === "medium" ? "media" : "baja"}
    </span>
  );
}
