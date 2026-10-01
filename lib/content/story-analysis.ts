import { isAnalysisStale, pipelineBase, type AnalysisConfidence, type AnalysisStatus } from "./analysis.ts";

export const STORY_ANALYSIS_PIPELINE_VERSION = "story-sequence-v2-gemini-3.8-flash";

/** Igual que en Reels: un análisis de una versión anterior, o de una secuencia que después creció, se puede actualizar. */
export function isStoryAnalysisOutdated(analysis: StorySequenceAnalysis, slideCount: number) {
  // Si después del análisis se publicaron más Historias ese día, el análisis ya no cubre la secuencia.
  return pipelineBase(analysis.pipelineVersion) !== STORY_ANALYSIS_PIPELINE_VERSION
    || analysis.slides.length !== slideCount;
}

export type StoryAnalysisKind = "strength" | "friction" | "opportunity";
export type StoryActionKind = "keep" | "change" | "test";

export type StorySequenceAnalysis = {
  pipelineVersion: string;
  completedAt: string;
  diagnosis: {
    verdict: string;
    explanation: string;
    confidence: AnalysisConfidence;
  };
  findings: Array<{
    kind: StoryAnalysisKind;
    title: string;
    insight: string;
    impact: string;
    slideNumbers: number[];
  }>;
  actions: Array<{
    kind: StoryActionKind;
    title: string;
    why: string;
    how: string;
    metricToWatch: string;
    slideNumbers: number[];
  }>;
  slides: Array<{
    slideNumber: number;
    role: "opening" | "context" | "proof" | "offer" | "cta" | "transition";
    visibleText: string;
    visual: string;
    reading: string;
    recommendation: string;
  }>;
};

export type StoryAnalysisState =
  | { status: "not_requested" }
  | { status: "queued" | "running"; startedAt: string | null }
  | { status: "ready"; analysis: StorySequenceAnalysis }
  | { status: "failed"; reason: string; canRetry: boolean };

const slideNumbersSchema = {
  type: "array",
  minItems: 1,
  maxItems: 5,
  items: { type: "integer", minimum: 1 },
} as const;

export const GEMINI_STORY_ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    diagnosis: {
      type: "object",
      properties: {
        verdict: { type: "string" },
        explanation: { type: "string" },
        confidence: { type: "string", enum: ["low", "medium", "high"] },
      },
      required: ["verdict", "explanation", "confidence"],
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
          slideNumbers: slideNumbersSchema,
        },
        required: ["kind", "title", "insight", "impact", "slideNumbers"],
        additionalProperties: false,
      },
    },
    actions: {
      type: "array",
      minItems: 3,
      maxItems: 6,
      items: {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["keep", "change", "test"] },
          title: { type: "string" },
          why: { type: "string" },
          how: { type: "string" },
          metricToWatch: { type: "string" },
          slideNumbers: slideNumbersSchema,
        },
        required: ["kind", "title", "why", "how", "metricToWatch", "slideNumbers"],
        additionalProperties: false,
      },
    },
    slides: {
      type: "array",
      minItems: 1,
      maxItems: 30,
      items: {
        type: "object",
        properties: {
          slideNumber: { type: "integer", minimum: 1 },
          role: { type: "string", enum: ["opening", "context", "proof", "offer", "cta", "transition"] },
          visibleText: { type: "string" },
          visual: { type: "string" },
          reading: { type: "string" },
          recommendation: { type: "string" },
        },
        required: ["slideNumber", "role", "visibleText", "visual", "reading", "recommendation"],
        additionalProperties: false,
      },
    },
  },
  required: ["diagnosis", "findings", "actions", "slides"],
  additionalProperties: false,
} as const;

export function parseStorySequenceAnalysis(value: unknown): StorySequenceAnalysis | null {
  if (!isRecord(value)) return null;
  if (typeof value.pipelineVersion !== "string" || typeof value.completedAt !== "string") return null;
  if (!isRecord(value.diagnosis) || !isConfidence(value.diagnosis.confidence)) return null;
  if (typeof value.diagnosis.verdict !== "string" || typeof value.diagnosis.explanation !== "string") return null;
  if (!Array.isArray(value.findings) || !Array.isArray(value.actions) || !Array.isArray(value.slides)) return null;

  const findings = value.findings.filter(isFinding);
  const actions = value.actions.filter(isAction);
  const slides = value.slides.filter(isSlide);
  if (findings.length !== value.findings.length || actions.length !== value.actions.length || slides.length !== value.slides.length) return null;

  return {
    pipelineVersion: value.pipelineVersion,
    completedAt: value.completedAt,
    diagnosis: {
      verdict: value.diagnosis.verdict,
      explanation: value.diagnosis.explanation,
      confidence: value.diagnosis.confidence,
    },
    findings,
    actions,
    slides,
  };
}

export function readStoryAnalysisState(row: {
  status: string;
  result: unknown;
  failureReason: string | null;
  canRetry: boolean;
  startedAt: string | null;
} | null): StoryAnalysisState {
  if (!row) return { status: "not_requested" };
  if ((row.status === "queued" || row.status === "running") && !isAnalysisStale(row.startedAt)) {
    return { status: row.status as Extract<AnalysisStatus, "queued" | "running">, startedAt: row.startedAt };
  }
  if (row.status === "ready") {
    const analysis = parseStorySequenceAnalysis(row.result);
    return analysis ? { status: "ready", analysis } : { status: "failed", reason: "El análisis guardado no se pudo leer.", canRetry: true };
  }
  return {
    status: "failed",
    reason: row.failureReason ?? "El análisis se interrumpió. Podés volver a intentarlo.",
    canRetry: row.canRetry,
  };
}

function isFinding(value: unknown): value is StorySequenceAnalysis["findings"][number] {
  return isRecord(value)
    && isEnum(value.kind, ["strength", "friction", "opportunity"])
    && hasStrings(value, ["title", "insight", "impact"])
    && isSlideNumbers(value.slideNumbers);
}

function isAction(value: unknown): value is StorySequenceAnalysis["actions"][number] {
  return isRecord(value)
    && isEnum(value.kind, ["keep", "change", "test"])
    && hasStrings(value, ["title", "why", "how", "metricToWatch"])
    && isSlideNumbers(value.slideNumbers);
}

function isSlide(value: unknown): value is StorySequenceAnalysis["slides"][number] {
  return isRecord(value)
    && Number.isInteger(value.slideNumber)
    && (value.slideNumber as number) >= 1
    && isEnum(value.role, ["opening", "context", "proof", "offer", "cta", "transition"])
    && hasStrings(value, ["visibleText", "visual", "reading", "recommendation"]);
}

function isSlideNumbers(value: unknown): value is number[] {
  return Array.isArray(value) && value.length > 0 && value.every((item) => Number.isInteger(item) && item >= 1);
}

function hasStrings(value: Record<string, unknown>, keys: string[]) {
  return keys.every((key) => typeof value[key] === "string");
}

function isConfidence(value: unknown): value is AnalysisConfidence {
  return isEnum(value, ["low", "medium", "high"]);
}

function isEnum<T extends string>(value: unknown, values: readonly T[]): value is T {
  return typeof value === "string" && values.includes(value as T);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
