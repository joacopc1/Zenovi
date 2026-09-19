import { Clock3, Lightbulb, Quote, RefreshCw, Sparkles } from "lucide-react";
import {
  ANALYSIS_CREDIT_COST,
  formatMoment,
  formatSpan,
  type AnalysisFinding,
  type AnalysisState,
  type ReelAnalysis,
} from "@/lib/content/analysis";

/**
 * El análisis de la pieza, en la vista de detalle.
 *
 * Es lo único de Zenovi que consume créditos, así que el estado inicial no esconde el
 * costo: dice qué se obtiene y cuánto cuesta antes de que la persona decida. Y como el
 * análisis lo escribe un modelo, cada afirmación se muestra junto a la cita o el momento
 * del video que la respalda, para que se pueda discutir en vez de creerla.
 */
export function AnalysisSection({ state }: { state: AnalysisState }) {
  return (
    <section className="rounded-card border border-mist bg-paper">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-mist px-5 py-4">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Sparkles size={16} strokeWidth={1.75} aria-hidden className="text-data" />
          Análisis
        </h2>
        {state.status === "ready" ? (
          <p className="font-support text-xs text-muted">
            Analizado el {new Date(state.analysis.completedAt).toLocaleDateString("es-UY", { day: "numeric", month: "long" })}
          </p>
        ) : null}
      </header>

      <div className="px-5 py-5">
        {state.status === "not_requested" ? <NotRequested /> : null}
        {state.status === "queued" || state.status === "running" ? <InProgress /> : null}
        {state.status === "failed" ? <Failed reason={state.reason} canRetry={state.canRetry} /> : null}
        {state.status === "ready" ? <Ready analysis={state.analysis} /> : null}
      </div>
    </section>
  );
}

function NotRequested() {
  return (
    <>
      <p className="font-support text-sm leading-6 text-graphite">
        Zenovi puede mirar esta pieza entera —lo que decís, cómo abre, cómo está armada y
        qué pide al final— y cruzarlo con cómo rindió, para decirte qué conviene repetir y
        qué probar distinto.
      </p>

      <ul className="font-support mt-4 grid gap-2 text-[13px] leading-6 text-graphite sm:grid-cols-2">
        <li>· El gancho: qué se dice y qué se ve en los primeros segundos.</li>
        <li>· La promesa y si el contenido la cumple.</li>
        <li>· La estructura y el ritmo, tramo por tramo.</li>
        <li>· El cierre y qué acción propone.</li>
        <li>· La transcripción completa con sus tiempos.</li>
        <li>· Qué conservar, qué cambiar y qué probar.</li>
      </ul>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-mist pt-4">
        <button
          type="button"
          disabled
          className="inline-flex min-h-9 cursor-not-allowed items-center gap-2 rounded-control bg-ink/30 px-4 text-sm font-semibold text-paper"
        >
          <Sparkles size={15} strokeWidth={2} aria-hidden />
          Analizar esta pieza
        </button>
        <p className="font-support text-xs text-muted">
          Cuesta {ANALYSIS_CREDIT_COST} crédito y tarda un par de minutos. Se analiza sólo cuando lo pedís:
          el resultado queda guardado y volver a abrirlo no consume nada.
        </p>
      </div>
    </>
  );
}

function InProgress() {
  return (
    <div className="flex items-start gap-3">
      <Clock3 size={16} strokeWidth={1.75} aria-hidden className="mt-0.5 shrink-0 text-graphite" />
      <p className="font-support text-sm leading-6 text-graphite">
        Estamos analizando esta pieza. Podés seguir usando Zenovi mientras tanto: cuando
        termine, el resultado aparece acá.
      </p>
    </div>
  );
}

function Failed({ reason, canRetry }: { reason: string; canRetry: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <RefreshCw size={16} strokeWidth={1.75} aria-hidden className="mt-0.5 shrink-0 text-danger" />
      <div>
        <p className="font-support text-sm leading-6 text-graphite">{reason}</p>
        {canRetry ? (
          <p className="font-support mt-1 text-xs text-muted">No se descontó ningún crédito. Podés volver a intentarlo.</p>
        ) : null}
      </div>
    </div>
  );
}

function Ready({ analysis }: { analysis: ReelAnalysis }) {
  return (
    <div className="space-y-6">
      <p className="text-[15px] leading-7">{analysis.summary}</p>

      <Finding title="El gancho" finding={analysis.hook} />
      <Finding title="La promesa" finding={analysis.promise} />

      <Block title="Estructura y ritmo">
        <ol className="space-y-2.5">
          {analysis.structure.map((part) => (
            <li key={`${part.fromMs}-${part.label}`} className="flex gap-3">
              <span className="font-numeric w-[74px] shrink-0 pt-0.5 text-xs text-muted">
                {formatSpan(part.fromMs, part.toMs)}
              </span>
              <span className="font-support text-[13px] leading-6 text-graphite">
                <strong className="font-semibold text-ink">{part.label}.</strong> {part.note}
              </span>
            </li>
          ))}
        </ol>
      </Block>

      <Finding title="Cómo lo contás" finding={analysis.delivery} />
      <Finding title="El cierre" finding={analysis.callToAction} />

      <Block title="Qué hacer con esto">
        <ul className="space-y-2.5">
          {analysis.recommendations.map((recommendation) => (
            <li key={recommendation.text} className="flex gap-2.5">
              <Lightbulb
                size={15}
                strokeWidth={1.75}
                aria-hidden
                className={`mt-1 shrink-0 ${
                  recommendation.kind === "keep"
                    ? "text-success"
                    : recommendation.kind === "change"
                      ? "text-danger"
                      : "text-data"
                }`}
              />
              <span className="font-support text-[13px] leading-6 text-graphite">
                <strong className="font-semibold text-ink">
                  {recommendation.kind === "keep" ? "Conservá" : recommendation.kind === "change" ? "Cambiá" : "Probá"}:
                </strong>{" "}
                {recommendation.text}
              </span>
            </li>
          ))}
        </ul>
      </Block>

      <details className="border-t border-mist pt-4">
        <summary className="cursor-pointer text-[13px] font-medium text-ink">
          Transcripción completa
        </summary>
        <ol className="mt-3 space-y-2">
          {analysis.transcript.map((line) => (
            <li key={line.atMs} className="flex gap-3">
              <span className="font-numeric w-10 shrink-0 pt-0.5 text-xs text-muted">{formatMoment(line.atMs)}</span>
              <span className="font-support text-[13px] leading-6 text-graphite">{line.quote}</span>
            </li>
          ))}
        </ol>
      </details>

      <p className="font-support border-t border-mist pt-4 text-xs leading-5 text-muted">
        Lo escribió un modelo de inteligencia artificial a partir del video y de tus métricas.
        Puede equivocarse: cada afirmación va con lo que la respalda para que puedas
        comprobarla. Versión {analysis.pipelineVersion}.
      </p>
    </div>
  );
}

function Finding({ title, finding }: { title: string; finding: AnalysisFinding }) {
  return (
    <Block title={title}>
      <p className="font-support text-[13px] leading-6 text-graphite">{finding.claim}</p>
      {finding.evidence.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {finding.evidence.map((moment) => (
            <li key={moment.atMs} className="flex gap-2.5 rounded-control bg-canvas px-3 py-2">
              <Quote size={13} strokeWidth={1.75} aria-hidden className="mt-1 shrink-0 text-muted" />
              <span className="font-support text-[13px] leading-6 text-graphite">
                <span className="font-numeric text-xs text-muted">{formatMoment(moment.atMs)}</span>{" "}
                “{moment.quote}”
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </Block>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-mist pt-4">
      <h3 className="text-[13px] font-semibold tracking-[-0.01em]">{title}</h3>
      <div className="mt-2.5">{children}</div>
    </div>
  );
}
