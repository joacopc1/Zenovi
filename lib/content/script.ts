const SCRIPT_STALE_AFTER_MS = 10 * 60 * 1000;
export const SCRIPT_PIPELINE_VERSION = "script-v3-semantic-development-gemini-3.8-flash";

export type ScriptRole = "hook" | "development" | "cta";

export type ScriptMoment = {
  atMs: number;
  quote: string;
};

export type ScriptSegment = {
  role: ScriptRole;
  fromMs: number;
  toMs: number;
  note: string;
};

export type ReelScript = {
  pipelineVersion: string;
  completedAt: string;
  segments: ScriptSegment[];
  transcript: ScriptMoment[];
};

export type ReelScriptDraft = Omit<
  ReelScript,
  "pipelineVersion" | "completedAt" | "transcript"
>;

export type ScriptState =
  | { status: "not_requested" }
  | { status: "queued" | "running"; startedAt: string }
  | { status: "ready"; script: ReelScript }
  | { status: "failed"; reason: string; canRetry: boolean };

export function isScriptOutdated(script: ReelScript) {
  return script.pipelineVersion !== SCRIPT_PIPELINE_VERSION;
}

export type ScriptClassification = {
  /** Primera línea que ya no pertenece al Hook. */
  hookEndIndex: number;
  /** Inicios de ideas, ejemplos o pasos nuevos dentro del Desarrollo. */
  developmentBreakIndexes: number[];
  /** Primera línea del CTA, o -1 cuando no existe uno explícito. */
  ctaStartIndex: number;
};

export const GEMINI_REEL_SCRIPT_CLASSIFICATION_SCHEMA = {
  type: "object",
  properties: {
    hookEndIndex: { type: "integer", minimum: 1 },
    developmentBreakIndexes: {
      type: "array",
      maxItems: 4,
      items: { type: "integer", minimum: 1 },
    },
    ctaStartIndex: { type: "integer", minimum: -1 },
  },
  required: ["hookEndIndex", "developmentBreakIndexes", "ctaStartIndex"],
  additionalProperties: false,
} as const;

export function parseScriptClassification(value: unknown): ScriptClassification | null {
  if (
    !isRecord(value) ||
    !Number.isInteger(value.hookEndIndex) ||
    !Array.isArray(value.developmentBreakIndexes) ||
    value.developmentBreakIndexes.length > 4 ||
    !value.developmentBreakIndexes.every(Number.isInteger) ||
    !Number.isInteger(value.ctaStartIndex)
  ) {
    return null;
  }

  return {
    hookEndIndex: value.hookEndIndex as number,
    developmentBreakIndexes: value.developmentBreakIndexes as number[],
    ctaStartIndex: value.ctaStartIndex as number,
  };
}

export function parseReelScriptDraft(value: unknown): ReelScriptDraft | null {
  if (!isRecord(value)) return null;

  const segments = parseSegments(value.segments);
  if (!segments) return null;

  return { segments };
}

export function parseReelScript(value: unknown): ReelScript | null {
  if (!isRecord(value)) return null;
  const draft = parseReelScriptDraft(value);
  const transcript = parseMoments(value.transcript);

  if (
    !draft ||
    !transcript ||
    transcript.length === 0 ||
    !isNonEmptyString(value.pipelineVersion) ||
    !isNonEmptyString(value.completedAt)
  ) {
    return null;
  }

  return {
    pipelineVersion: value.pipelineVersion,
    completedAt: value.completedAt,
    ...draft,
    transcript,
  };
}

export function readScriptState(row: {
  status: string;
  result: unknown;
  failureReason: string | null;
  canRetry: boolean;
  startedAt: string | null;
} | null, now = new Date()): ScriptState {
  if (row === null) return { status: "not_requested" };

  if (row.status === "failed") {
    return {
      status: "failed",
      reason: row.failureReason ?? "No pudimos preparar el guion.",
      canRetry: row.canRetry,
    };
  }
  if (row.status === "ready") {
    const script = parseReelScript(row.result);
    return script
      ? { status: "ready", script }
      : {
          status: "failed",
          reason: "El guion terminó, pero no guardó un resultado válido.",
          canRetry: true,
        };
  }
  if (row.status === "queued" || row.status === "running") {
    if (isScriptStale(row.startedAt, now)) {
      return {
        status: "failed",
        reason: "La preparación del guion se interrumpió antes de terminar.",
        canRetry: true,
      };
    }
    return { status: row.status, startedAt: row.startedAt ?? new Date().toISOString() };
  }

  return {
    status: "failed",
    reason: "El guion quedó en un estado desconocido.",
    canRetry: true,
  };
}

function isScriptStale(startedAt: string | null, now: Date) {
  if (startedAt === null) return false;
  const startedAtMs = Date.parse(startedAt);
  return Number.isFinite(startedAtMs) && now.getTime() - startedAtMs > SCRIPT_STALE_AFTER_MS;
}

/**
 * Convierte dos límites semánticos en tramos continuos.
 *
 * Gemini elige líneas, no milisegundos: así los tiempos siempre vienen de Whisper y
 * nunca de una estimación del modelo. También se impide el atajo que antes llamaba Hook
 * al primer bloque narrativo entero y CTA al último aunque no pidiera ninguna acción.
 */
export function buildScriptSegments(
  transcript: readonly ScriptMoment[],
  classification: ScriptClassification,
): ScriptSegment[] {
  if (transcript.length < 2 || !hasStrictlyIncreasingTimes(transcript)) {
    throw new Error("invalid_transcript_for_classification");
  }

  const { hookEndIndex, developmentBreakIndexes, ctaStartIndex } = classification;
  const hasCta = ctaStartIndex !== -1;
  const developmentEndIndex = hasCta ? ctaStartIndex : transcript.length;
  const validBreaks = developmentBreakIndexes.every(
    (index, position) =>
      Number.isInteger(index) &&
      index > hookEndIndex &&
      index < developmentEndIndex &&
      (position === 0 || index > developmentBreakIndexes[position - 1]),
  );
  if (
    hookEndIndex < 1 ||
    hookEndIndex >= transcript.length ||
    (hasCta && (ctaStartIndex <= hookEndIndex || ctaStartIndex >= transcript.length)) ||
    !validBreaks
  ) {
    throw new Error("invalid_script_boundaries");
  }

  const finalEnd = transcript.at(-1)!.atMs + 1;
  const segments: ScriptSegment[] = [
    {
      role: "hook",
      fromMs: transcript[0].atMs,
      toMs: transcript[hookEndIndex].atMs,
      note: "Hook",
    },
  ];

  const developmentBoundaries = [
    hookEndIndex,
    ...developmentBreakIndexes,
    developmentEndIndex,
  ];
  for (let index = 0; index < developmentBoundaries.length - 1; index += 1) {
    const fromIndex = developmentBoundaries[index];
    const toIndex = developmentBoundaries[index + 1];
    segments.push({
      role: "development",
      fromMs: transcript[fromIndex].atMs,
      toMs: toIndex < transcript.length ? transcript[toIndex].atMs : finalEnd,
      note: "Desarrollo",
    });
  }

  if (hasCta) {
    segments.push({
      role: "cta",
      fromMs: transcript[ctaStartIndex].atMs,
      toMs: finalEnd,
      note: "CTA",
    });
  }

  return segments;
}

function hasStrictlyIncreasingTimes(transcript: readonly ScriptMoment[]) {
  return transcript.every(
    (moment, index) => index === 0 || moment.atMs > transcript[index - 1].atMs,
  );
}

function parseSegments(value: unknown): ScriptSegment[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const segments: ScriptSegment[] = [];

  for (const item of value) {
    if (
      !isRecord(item) ||
      (item.role !== "hook" && item.role !== "development" && item.role !== "cta") ||
      !Number.isFinite(item.fromMs) ||
      !Number.isFinite(item.toMs) ||
      (item.fromMs as number) < 0 ||
      (item.toMs as number) < (item.fromMs as number) ||
      !isNonEmptyString(item.note)
    ) {
      return null;
    }
    segments.push({
      role: item.role,
      fromMs: Math.round(item.fromMs as number),
      toMs: Math.round(item.toMs as number),
      note: item.note,
    });
  }

  return segments;
}

function parseMoments(value: unknown): ScriptMoment[] | null {
  if (!Array.isArray(value)) return null;
  const moments: ScriptMoment[] = [];

  for (const item of value) {
    if (
      !isRecord(item) ||
      !Number.isFinite(item.atMs) ||
      (item.atMs as number) < 0 ||
      !isNonEmptyString(item.quote)
    ) {
      return null;
    }
    moments.push({ atMs: Math.round(item.atMs as number), quote: item.quote });
  }

  return moments;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
