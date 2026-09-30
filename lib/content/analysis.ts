/** Contrato persistido del análisis de una pieza y sus estados de trabajo. */
export type AnalysisStatus = "not_requested" | "queued" | "running" | "ready" | "failed";
export const ANALYSIS_STALE_AFTER_MS = 10 * 60 * 1000;
export const ANALYSIS_PIPELINE_VERSION = "reel-v5-reel-map-gemini-3.8-flash";

export type AnalysisMoment = { atMs: number; quote: string };

/** Hallazgo del formato anterior. Se conserva únicamente para leer resultados guardados. */
export type AnalysisFinding = {
  claim: string;
  evidence: AnalysisMoment[];
};

export type AnalysisRecommendation = {
  kind: "keep" | "change" | "test";
  text: string;
};

export type AnalysisConfidence = "low" | "medium" | "high";
export type DecisionKind = "strength" | "friction" | "opportunity";
export type ActionKind = "keep" | "change" | "test";
export type ExecutionDimension = "voice" | "body" | "visual" | "editing" | "sound";
export type ReelMapRole = "hook" | "context" | "development" | "proof" | "transition" | "cta";

export type PerformanceDiagnosis = {
  verdict: string;
  explanation: string;
  confidence: AnalysisConfidence;
  evidence: AnalysisMoment[];
};

export type DecisionFinding = {
  kind: DecisionKind;
  title: string;
  insight: string;
  impact: string;
  evidence: AnalysisMoment[];
};

export type AttentionHypothesis = {
  title: string;
  hypothesis: string;
  confidence: AnalysisConfidence;
  evidence: AnalysisMoment[];
};

export type ActionableRecommendation = {
  title: string;
  fromMs: number;
  toMs: number;
  why: string;
  how: string;
  metricToWatch: string;
  evidence: AnalysisMoment[];
};

export type ActionPlan = Record<ActionKind, ActionableRecommendation[]>;

export type ExecutionFinding = {
  dimension: ExecutionDimension;
  kind: DecisionKind;
  title: string;
  observation: string;
  impact: string;
  recommendation: string;
  evidence: AnalysisMoment[];
};

export type ReversionIdea = {
  title: string;
  change: string;
  why: string;
  evidence: AnalysisMoment[];
};

export type ReelMapSegment = {
  role: ReelMapRole;
  label: string;
  fromMs: number;
  toMs: number;
  visual: string;
  onScreenText: string;
  finding: string;
  recommendation: string;
};

export type LegacyReelAnalysisDraft = {
  summary: string;
  audience?: AnalysisFinding;
  hook: AnalysisFinding;
  visualHook?: AnalysisFinding;
  promise: AnalysisFinding;
  structure: { label: string; fromMs: number; toMs: number; note: string }[];
  delivery: AnalysisFinding;
  callToAction: AnalysisFinding;
  retentionHypotheses?: AnalysisFinding[];
  recommendations: AnalysisRecommendation[];
};

export type ActionableReelAnalysisDraft = {
  performance: PerformanceDiagnosis;
  findings: DecisionFinding[];
  attentionHypotheses: AttentionHypothesis[];
  actionPlan: ActionPlan;
  executionReview: ExecutionFinding[];
  reversionIdeas: ReversionIdea[];
  reelMap: ReelMapSegment[];
};

export type ReelAnalysisDraft = LegacyReelAnalysisDraft | ActionableReelAnalysisDraft;

type StoredAnalysisMetadata = {
  pipelineVersion: string;
  completedAt: string;
  transcript: AnalysisMoment[];
};

export type LegacyReelAnalysis = LegacyReelAnalysisDraft & StoredAnalysisMetadata;
export type ActionableReelAnalysis = ActionableReelAnalysisDraft & StoredAnalysisMetadata;
export type ReelAnalysis = LegacyReelAnalysis | ActionableReelAnalysis;

export function isActionableAnalysis(
  analysis: ReelAnalysis,
): analysis is ActionableReelAnalysis {
  return "actionPlan" in analysis && "performance" in analysis;
}

export function isAnalysisOutdated(analysis: ReelAnalysis) {
  return analysis.pipelineVersion !== ANALYSIS_PIPELINE_VERSION;
}

const evidenceSchema = {
  type: "object",
  properties: {
    atMs: { type: "integer", minimum: 0 },
    quote: { type: "string" },
  },
  required: ["atMs", "quote"],
  additionalProperties: false,
} as const;

const confidenceSchema = { type: "string", enum: ["low", "medium", "high"] } as const;

/** Gemini sólo escribe decisiones. La descripción del Reel queda como razonamiento interno. */
export const GEMINI_REEL_ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    performance: {
      type: "object",
      properties: {
        verdict: { type: "string" },
        explanation: { type: "string" },
        confidence: confidenceSchema,
        evidence: { type: "array", minItems: 1, maxItems: 3, items: evidenceSchema },
      },
      required: ["verdict", "explanation", "confidence", "evidence"],
      additionalProperties: false,
    },
    findings: {
      type: "array",
      minItems: 2,
      maxItems: 5,
      items: {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["strength", "friction", "opportunity"] },
          title: { type: "string" },
          insight: { type: "string" },
          impact: { type: "string" },
          evidence: { type: "array", minItems: 1, maxItems: 3, items: evidenceSchema },
        },
        required: ["kind", "title", "insight", "impact", "evidence"],
        additionalProperties: false,
      },
    },
    attentionHypotheses: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          hypothesis: { type: "string" },
          confidence: confidenceSchema,
          evidence: { type: "array", minItems: 1, maxItems: 3, items: evidenceSchema },
        },
        required: ["title", "hypothesis", "confidence", "evidence"],
        additionalProperties: false,
      },
    },
    // Una lista compacta evita repetir tres veces el mismo subesquema. Gemini puede
    // rechazar esquemas demasiado grandes o profundos antes de mirar el contenido.
    actions: generatedActionListSchema(),
    executionReview: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: {
        type: "object",
        properties: {
          dimension: { type: "string", enum: ["voice", "body", "visual", "editing", "sound"] },
          kind: { type: "string", enum: ["strength", "friction", "opportunity"] },
          title: { type: "string" },
          observation: { type: "string" },
          impact: { type: "string" },
          recommendation: { type: "string" },
          evidence: { type: "array", minItems: 1, maxItems: 3, items: evidenceSchema },
        },
        required: ["dimension", "kind", "title", "observation", "impact", "recommendation", "evidence"],
        additionalProperties: false,
      },
    },
    reelMap: {
      type: "array",
      minItems: 3,
      maxItems: 8,
      items: {
        type: "object",
        properties: {
          role: {
            type: "string",
            enum: ["hook", "context", "development", "proof", "transition", "cta"],
          },
          label: { type: "string" },
          fromMs: { type: "integer", minimum: 0 },
          toMs: { type: "integer", minimum: 0 },
          visual: { type: "string" },
          onScreenText: { type: "string" },
          finding: { type: "string" },
          recommendation: { type: "string" },
        },
        required: [
          "role",
          "label",
          "fromMs",
          "toMs",
          "visual",
          "onScreenText",
          "finding",
          "recommendation",
        ],
        additionalProperties: false,
      },
    },
    reversionIdeas: {
      type: "array",
      minItems: 0,
      maxItems: 2,
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          change: { type: "string" },
          why: { type: "string" },
          evidence: { type: "array", minItems: 1, maxItems: 3, items: evidenceSchema },
        },
        required: ["title", "change", "why", "evidence"],
        additionalProperties: false,
      },
    },
  },
  required: [
    "performance",
    "findings",
    "attentionHypotheses",
    "actions",
    "executionReview",
    "reelMap",
    "reversionIdeas",
  ],
  additionalProperties: false,
} as const;

function generatedActionListSchema() {
  return {
    type: "array",
    minItems: 3,
    maxItems: 6,
    items: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["keep", "change", "test"] },
        title: { type: "string" },
        fromMs: { type: "integer", minimum: 0 },
        toMs: { type: "integer", minimum: 0 },
        why: { type: "string" },
        how: { type: "string" },
        metricToWatch: { type: "string" },
        evidence: { type: "array", minItems: 1, maxItems: 3, items: evidenceSchema },
      },
      required: ["kind", "title", "fromMs", "toMs", "why", "how", "metricToWatch", "evidence"],
      additionalProperties: false,
    },
  } as const;
}

export type AnalysisState =
  | { status: "not_requested" }
  | { status: "queued" | "running"; startedAt: string }
  | { status: "ready"; analysis: ReelAnalysis }
  | { status: "failed"; reason: string; canRetry: boolean };

export function formatMoment(atMs: number) {
  const totalSeconds = Math.max(0, Math.round(atMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatSpan(fromMs: number, toMs: number) {
  return `${formatMoment(fromMs)} – ${formatMoment(toMs)}`;
}

export function estimateSpeakingPaceWpm(transcript: AnalysisMoment[]) {
  if (transcript.length < 2) return null;
  const spokenMs = transcript.at(-1)!.atMs - transcript[0].atMs;
  if (spokenMs < 5_000) return null;
  const words = transcript.reduce(
    (total, moment) => total + moment.quote.trim().split(/\s+/u).filter(Boolean).length,
    0,
  );
  return Math.round(words / (spokenMs / 60_000));
}

export const ANALYSIS_JOB_STATUSES = ["queued", "running", "ready", "failed"] as const;
export type AnalysisJobStatus = (typeof ANALYSIS_JOB_STATUSES)[number];

export function isAnalysisJobStatus(value: unknown): value is AnalysisJobStatus {
  return typeof value === "string" && ANALYSIS_JOB_STATUSES.includes(value as AnalysisJobStatus);
}

export function readAnalysisState(row: {
  status: string;
  result: unknown;
  failureReason: string | null;
  canRetry: boolean;
  startedAt: string | null;
} | null, now = new Date()): AnalysisState {
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
    const analysis = parseReelAnalysis(row.result);
    return analysis
      ? { status: "ready", analysis }
      : { status: "failed", reason: "El análisis terminó pero no guardó su resultado.", canRetry: true };
  }
  if (isAnalysisStale(row.startedAt, now)) {
    return { status: "failed", reason: "El análisis se interrumpió antes de terminar.", canRetry: true };
  }
  return { status: row.status, startedAt: row.startedAt ?? now.toISOString() };
}

export function isAnalysisStale(startedAt: string | null, now = new Date()) {
  if (startedAt === null) return false;
  const startedAtMs = Date.parse(startedAt);
  return Number.isFinite(startedAtMs) && now.getTime() - startedAtMs > ANALYSIS_STALE_AFTER_MS;
}

export function parseReelAnalysisDraft(value: unknown): ReelAnalysisDraft | null {
  return parseActionableDraft(value) ?? parseLegacyDraft(value);
}

export function parseGeneratedReelAnalysisDraft(
  value: unknown,
): ActionableReelAnalysisDraft | null {
  if (
    !isRecord(value) || value.actions === undefined || value.actionPlan !== undefined ||
    value.executionReview === undefined || value.reversionIdeas === undefined ||
    value.reelMap === undefined
  ) {
    return null;
  }
  return parseActionableDraft(value);
}

export function parseReelAnalysis(value: unknown): ReelAnalysis | null {
  if (!isRecord(value)) return null;
  const draft = parseReelAnalysisDraft(value);
  const transcript = parseMoments(value.transcript);
  if (!draft || !transcript?.length || !isNonEmptyString(value.pipelineVersion) || !isNonEmptyString(value.completedAt)) {
    return null;
  }
  return {
    pipelineVersion: value.pipelineVersion,
    completedAt: value.completedAt,
    transcript,
    ...draft,
  };
}

function parseActionableDraft(value: unknown): ActionableReelAnalysisDraft | null {
  if (!isRecord(value)) return null;
  const performance = parsePerformance(value.performance);
  const findings = parseDecisionFindings(value.findings);
  const attentionHypotheses = parseAttentionHypotheses(value.attentionHypotheses);
  const actionPlan = parseActionPlan(value.actionPlan) ?? parseFlatActionList(value.actions);
  const executionReview = value.executionReview === undefined ? [] : parseExecutionReview(value.executionReview);
  const reversionIdeas = value.reversionIdeas === undefined ? [] : parseReversionIdeas(value.reversionIdeas);
  const reelMap = value.reelMap === undefined ? [] : parseReelMap(value.reelMap);
  if (
    !performance || !findings || !attentionHypotheses || !actionPlan ||
    !executionReview || !reversionIdeas || !reelMap
  ) return null;
  return {
    performance,
    findings,
    attentionHypotheses,
    actionPlan,
    executionReview,
    reversionIdeas,
    reelMap,
  };
}

function parsePerformance(value: unknown): PerformanceDiagnosis | null {
  if (!isRecord(value) || !isNonEmptyString(value.verdict) || !isNonEmptyString(value.explanation) || !isConfidence(value.confidence)) return null;
  const evidence = parseMoments(value.evidence);
  return evidence?.length
    ? { verdict: value.verdict, explanation: value.explanation, confidence: value.confidence, evidence }
    : null;
}

function parseDecisionFindings(value: unknown): DecisionFinding[] | null {
  if (!Array.isArray(value) || value.length < 2 || value.length > 5) return null;
  const findings: DecisionFinding[] = [];
  for (const item of value) {
    if (!isRecord(item) || !isDecisionKind(item.kind) || !isNonEmptyString(item.title) || !isNonEmptyString(item.insight) || !isNonEmptyString(item.impact)) return null;
    const evidence = parseMoments(item.evidence);
    if (!evidence?.length) return null;
    findings.push({ kind: item.kind, title: item.title, insight: item.insight, impact: item.impact, evidence });
  }
  return findings;
}

function parseAttentionHypotheses(value: unknown): AttentionHypothesis[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > 3) return null;
  const hypotheses: AttentionHypothesis[] = [];
  for (const item of value) {
    if (!isRecord(item) || !isNonEmptyString(item.title) || !isNonEmptyString(item.hypothesis) || !isConfidence(item.confidence)) return null;
    const evidence = parseMoments(item.evidence);
    if (!evidence?.length) return null;
    hypotheses.push({ title: item.title, hypothesis: item.hypothesis, confidence: item.confidence, evidence });
  }
  return hypotheses;
}

function parseActionPlan(value: unknown): ActionPlan | null {
  if (!isRecord(value)) return null;
  const keep = parseActions(value.keep);
  const change = parseActions(value.change);
  const test = parseActions(value.test);
  return keep && change && test ? { keep, change, test } : null;
}

/** Normaliza la lista compacta del proveedor y los resultados v2 que usaban la misma forma. */
function parseFlatActionList(value: unknown): ActionPlan | null {
  if (!Array.isArray(value) || value.length < 3 || value.length > 6) return null;
  const plan: ActionPlan = { keep: [], change: [], test: [] };
  for (const item of value) {
    if (!isRecord(item) || !isActionKind(item.kind)) return null;
    const [action] = parseActions([item]) ?? [];
    if (!action) return null;
    plan[item.kind].push(action);
  }
  return (Object.values(plan) as ActionableRecommendation[][]).every(
    (actions) => actions.length >= 1 && actions.length <= 2,
  )
    ? plan
    : null;
}

function parseActions(value: unknown): ActionableRecommendation[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > 2) return null;
  const actions: ActionableRecommendation[] = [];
  for (const item of value) {
    if (
      !isRecord(item) || !isNonEmptyString(item.title) ||
      !Number.isFinite(item.fromMs) || !Number.isFinite(item.toMs) ||
      (item.fromMs as number) < 0 || (item.toMs as number) < (item.fromMs as number) ||
      !isNonEmptyString(item.why) || !isNonEmptyString(item.how) || !isNonEmptyString(item.metricToWatch)
    ) return null;
    const evidence = parseMoments(item.evidence);
    if (!evidence?.length) return null;
    actions.push({
      title: item.title,
      fromMs: Math.round(item.fromMs as number),
      toMs: Math.round(item.toMs as number),
      why: item.why,
      how: item.how,
      metricToWatch: item.metricToWatch,
      evidence,
    });
  }
  return actions;
}

function parseExecutionReview(value: unknown): ExecutionFinding[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > 5) return null;
  const findings: ExecutionFinding[] = [];
  for (const item of value) {
    if (
      !isRecord(item) || !isExecutionDimension(item.dimension) || !isDecisionKind(item.kind) ||
      !isNonEmptyString(item.title) || !isNonEmptyString(item.observation) ||
      !isNonEmptyString(item.impact) || !isNonEmptyString(item.recommendation)
    ) return null;
    const evidence = parseMoments(item.evidence);
    if (!evidence?.length) return null;
    findings.push({
      dimension: item.dimension,
      kind: item.kind,
      title: item.title,
      observation: item.observation,
      impact: item.impact,
      recommendation: item.recommendation,
      evidence,
    });
  }
  return findings;
}

function parseReversionIdeas(value: unknown): ReversionIdea[] | null {
  if (!Array.isArray(value) || value.length > 2) return null;
  const ideas: ReversionIdea[] = [];
  for (const item of value) {
    if (
      !isRecord(item) || !isNonEmptyString(item.title) ||
      !isNonEmptyString(item.change) || !isNonEmptyString(item.why)
    ) return null;
    const evidence = parseMoments(item.evidence);
    if (!evidence?.length) return null;
    ideas.push({ title: item.title, change: item.change, why: item.why, evidence });
  }
  return ideas;
}

function parseReelMap(value: unknown): ReelMapSegment[] | null {
  if (!Array.isArray(value) || value.length < 3 || value.length > 8) return null;
  const segments: ReelMapSegment[] = [];
  let previousToMs = 0;

  for (const item of value) {
    if (
      !isRecord(item) || !isReelMapRole(item.role) || !isNonEmptyString(item.label) ||
      !Number.isFinite(item.fromMs) || !Number.isFinite(item.toMs) ||
      (item.fromMs as number) < previousToMs || (item.toMs as number) <= (item.fromMs as number) ||
      !isNonEmptyString(item.visual) || typeof item.onScreenText !== "string" ||
      !isNonEmptyString(item.finding) || !isNonEmptyString(item.recommendation)
    ) return null;

    const segment = {
      role: item.role,
      label: item.label,
      fromMs: Math.round(item.fromMs as number),
      toMs: Math.round(item.toMs as number),
      visual: item.visual,
      onScreenText: item.onScreenText.trim(),
      finding: item.finding,
      recommendation: item.recommendation,
    };
    segments.push(segment);
    previousToMs = segment.toMs;
  }

  return segments;
}

function parseLegacyDraft(value: unknown): LegacyReelAnalysisDraft | null {
  if (!isRecord(value) || !isNonEmptyString(value.summary)) return null;
  const hook = parseFinding(value.hook);
  const promise = parseFinding(value.promise);
  const delivery = parseFinding(value.delivery);
  const callToAction = parseFinding(value.callToAction);
  const structure = parseStructure(value.structure);
  const recommendations = parseRecommendations(value.recommendations);
  const audience = value.audience === undefined ? undefined : parseFinding(value.audience);
  const visualHook = value.visualHook === undefined ? undefined : parseFinding(value.visualHook);
  const retentionHypotheses = value.retentionHypotheses === undefined ? undefined : parseFindingList(value.retentionHypotheses);
  if (
    !hook || !promise || !delivery || !callToAction || !structure || !recommendations ||
    (value.audience !== undefined && !audience) ||
    (value.visualHook !== undefined && !visualHook) ||
    (value.retentionHypotheses !== undefined && !retentionHypotheses)
  ) return null;
  return {
    summary: value.summary,
    ...(audience ? { audience } : {}),
    hook,
    ...(visualHook ? { visualHook } : {}),
    promise,
    structure,
    delivery,
    callToAction,
    ...(retentionHypotheses ? { retentionHypotheses } : {}),
    recommendations,
  };
}

function parseFinding(value: unknown): AnalysisFinding | null {
  if (!isRecord(value) || !isNonEmptyString(value.claim)) return null;
  const evidence = parseMoments(value.evidence);
  return evidence?.length ? { claim: value.claim, evidence } : null;
}

function parseFindingList(value: unknown): AnalysisFinding[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const findings: AnalysisFinding[] = [];
  for (const item of value) {
    const finding = parseFinding(item);
    if (!finding) return null;
    findings.push(finding);
  }
  return findings;
}

function parseMoments(value: unknown): AnalysisMoment[] | null {
  if (!Array.isArray(value)) return null;
  const moments: AnalysisMoment[] = [];
  for (const item of value) {
    if (!isRecord(item) || !Number.isFinite(item.atMs) || (item.atMs as number) < 0 || !isNonEmptyString(item.quote)) return null;
    moments.push({ atMs: Math.round(item.atMs as number), quote: item.quote });
  }
  return moments;
}

function parseStructure(value: unknown): LegacyReelAnalysisDraft["structure"] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const parts: LegacyReelAnalysisDraft["structure"] = [];
  for (const item of value) {
    if (
      !isRecord(item) || !isNonEmptyString(item.label) || !isNonEmptyString(item.note) ||
      !Number.isFinite(item.fromMs) || !Number.isFinite(item.toMs) ||
      (item.fromMs as number) < 0 || (item.toMs as number) < (item.fromMs as number)
    ) return null;
    parts.push({
      label: item.label,
      fromMs: Math.round(item.fromMs as number),
      toMs: Math.round(item.toMs as number),
      note: item.note,
    });
  }
  return parts;
}

function parseRecommendations(value: unknown): AnalysisRecommendation[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const recommendations: AnalysisRecommendation[] = [];
  for (const item of value) {
    if (!isRecord(item) || !isActionKind(item.kind) || !isNonEmptyString(item.text)) return null;
    recommendations.push({ kind: item.kind, text: item.text });
  }
  return recommendations;
}

function isConfidence(value: unknown): value is AnalysisConfidence {
  return value === "low" || value === "medium" || value === "high";
}

function isDecisionKind(value: unknown): value is DecisionKind {
  return value === "strength" || value === "friction" || value === "opportunity";
}

function isActionKind(value: unknown): value is ActionKind {
  return value === "keep" || value === "change" || value === "test";
}

function isExecutionDimension(value: unknown): value is ExecutionDimension {
  return value === "voice" || value === "body" || value === "visual" || value === "editing" || value === "sound";
}

function isReelMapRole(value: unknown): value is ReelMapRole {
  return value === "hook" || value === "context" || value === "development" ||
    value === "proof" || value === "transition" || value === "cta";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
