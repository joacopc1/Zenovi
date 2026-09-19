/**
 * El análisis de una pieza: qué guarda y en qué estado está.
 *
 * Se pide a demanda y consume créditos, así que una pieza puede no tener análisis, tener
 * uno en curso, uno listo o uno que falló. El resultado se guarda entero: abrirlo de
 * nuevo nunca reprocesa el video.
 *
 * Cada afirmación que se muestra tiene que poder apoyarse en algo observable —una frase
 * de la transcripción, un momento del video, una métrica—, por eso las secciones llevan
 * su evidencia al lado en vez de una conclusión suelta.
 */
export type AnalysisStatus = "not_requested" | "queued" | "running" | "ready" | "failed";

/** Un momento del video, en milisegundos desde el inicio. */
export type AnalysisMoment = { atMs: number; quote: string };

export type AnalysisFinding = {
  /** Qué se observó, en una frase. */
  claim: string;
  /** Por qué se afirma: la cita o el momento que lo respalda. */
  evidence: AnalysisMoment[];
};

export type AnalysisRecommendation = {
  kind: "keep" | "change" | "test";
  text: string;
};

export type ReelAnalysis = {
  /** Versión del pipeline que lo produjo: un análisis viejo se puede reconocer. */
  pipelineVersion: string;
  completedAt: string;
  summary: string;
  hook: AnalysisFinding;
  promise: AnalysisFinding;
  structure: { label: string; fromMs: number; toMs: number; note: string }[];
  delivery: AnalysisFinding;
  callToAction: AnalysisFinding;
  recommendations: AnalysisRecommendation[];
  transcript: AnalysisMoment[];
};

export type AnalysisState =
  | { status: "not_requested" }
  | { status: "queued" | "running"; startedAt: string }
  | { status: "ready"; analysis: ReelAnalysis }
  | { status: "failed"; reason: string; canRetry: boolean };

/** Los créditos que consume analizar una pieza. Provisional hasta cerrar el pricing. */
export const ANALYSIS_CREDIT_COST = 1;

export function formatMoment(atMs: number) {
  const totalSeconds = Math.max(0, Math.round(atMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** Un tramo de la estructura, leído como "0:00 – 0:03". */
export function formatSpan(fromMs: number, toMs: number) {
  return `${formatMoment(fromMs)} – ${formatMoment(toMs)}`;
}
