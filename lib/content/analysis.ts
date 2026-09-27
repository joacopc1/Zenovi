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

/** Los estados que puede tener el trabajo, como los guarda la base. */
export const ANALYSIS_JOB_STATUSES = ["queued", "running", "ready", "failed"] as const;
export type AnalysisJobStatus = (typeof ANALYSIS_JOB_STATUSES)[number];

export function isAnalysisJobStatus(value: unknown): value is AnalysisJobStatus {
  return (
    typeof value === "string" && ANALYSIS_JOB_STATUSES.includes(value as AnalysisJobStatus)
  );
}

/**
 * Una fila de `content_analyses` leída como estado de pantalla.
 *
 * La base guarda el estado del trabajo y la pantalla dibuja el de la pieza, que no es lo
 * mismo: sin fila no hay "no pedido" en la base, hay ausencia. Y una fila que dice "listo"
 * pero no trajo resultado es una fila rota —la base lo impide con un check, pero la
 * lectura no puede asumir que nadie la tocó por otro camino— así que se trata como falla
 * en vez de romper la pantalla.
 */
export function readAnalysisState(row: {
  status: string;
  result: unknown;
  failureReason: string | null;
  canRetry: boolean;
  startedAt: string | null;
} | null): AnalysisState {
  if (row === null) return { status: "not_requested" };

  if (!isAnalysisJobStatus(row.status)) {
    return { status: "failed", reason: "El análisis quedó en un estado desconocido.", canRetry: true };
  }

  if (row.status === "failed") {
    return {
      status: "failed",
      reason: row.failureReason ?? "El análisis no pudo terminar.",
      canRetry: row.canRetry,
    };
  }

  if (row.status === "ready") {
    const analysis = row.result as ReelAnalysis | null;
    if (!analysis) {
      return {
        status: "failed",
        reason: "El análisis terminó pero no guardó su resultado.",
        canRetry: true,
      };
    }
    return { status: "ready", analysis };
  }

  return { status: row.status, startedAt: row.startedAt ?? new Date().toISOString() };
}
