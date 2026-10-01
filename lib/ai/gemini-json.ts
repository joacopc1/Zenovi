import {
  AiProviderError,
  classifyGeminiFailure,
  normalizeAiFailure,
} from "./provider-error.ts";

const INLINE_REQUEST_LIMIT = 20 * 1024 * 1024;
const MAX_ATTEMPTS_PER_MODEL = 2;
const DEFAULT_FALLBACK_MODEL = "gemini-3.7-flash";
export const GEMINI_TEXT_TIMEOUT_MS = 45_000;
export const GEMINI_VIDEO_TIMEOUT_MS = 150_000;

type GenerateGeminiVideoJsonInput = {
  apiKey: string;
  model: string;
  video: Buffer;
  prompt: string;
  schema: object;
};

type GenerateGeminiTextJsonInput = Omit<GenerateGeminiVideoJsonInput, "video">;

export type GeminiInlineMedia = {
  type: "image" | "video";
  data: Buffer;
  mimeType: string;
  name: string;
};

type GenerateGeminiMediaJsonInput = {
  apiKey: string;
  model: string;
  media: GeminiInlineMedia[];
  prompt: string;
  schema: object;
};

export type GeminiUsage = {
  input: number | null;
  output: number | null;
  thoughts: number | null;
  total: number | null;
};

type GeminiJsonResult = {
  value: unknown;
  usage: GeminiUsage | null;
  model: string;
};

/** Pide JSON estructurado a Gemini con un video inline y reintenta sólo fallos pasajeros. */
export async function generateGeminiVideoJson({
  apiKey,
  model,
  video,
  prompt,
  schema,
}: GenerateGeminiVideoJsonInput): Promise<GeminiJsonResult> {
  const encodedVideo = video.toString("base64");
  const content = [
    { type: "text", text: prompt },
    {
      type: "video",
      data: encodedVideo,
      mime_type: "video/mp4",
      processing: "static",
    },
  ];
  const body = buildBody(model, schema, content);

  if (Buffer.byteLength(body) >= INLINE_REQUEST_LIMIT) {
    throw new Error("video_too_large_for_inline_analysis");
  }

  return requestGeminiJson(apiKey, model, schema, content, GEMINI_VIDEO_TIMEOUT_MS);
}

/** Clasifica texto estructurado sin volver a enviar ni procesar el video. */
export async function generateGeminiTextJson({
  apiKey,
  model,
  prompt,
  schema,
}: GenerateGeminiTextJsonInput): Promise<GeminiJsonResult> {
  return requestGeminiJson(apiKey, model, schema, [{ type: "text", text: prompt }], GEMINI_TEXT_TIMEOUT_MS);
}

/** Analiza una secuencia ordenada de imágenes y videos en una única interacción. */
export async function generateGeminiMediaJson({
  apiKey,
  model,
  media,
  prompt,
  schema,
}: GenerateGeminiMediaJsonInput): Promise<GeminiJsonResult> {
  const content = [
    { type: "text", text: prompt },
    ...media.flatMap((item, index) => [
      { type: "text", text: `Historia ${index + 1}: ${item.name}` },
      item.type === "video"
        ? {
            type: "video",
            data: item.data.toString("base64"),
            mime_type: item.mimeType,
            processing: "static",
            name: item.name,
          }
        : {
            type: "image",
            data: item.data.toString("base64"),
            mime_type: item.mimeType,
          },
    ]),
  ];
  const body = buildBody(model, schema, content);

  if (Buffer.byteLength(body) >= INLINE_REQUEST_LIMIT) {
    throw new Error("story_sequence_too_large_for_inline_analysis");
  }

  return requestGeminiJson(apiKey, model, schema, content, GEMINI_VIDEO_TIMEOUT_MS);
}

function buildBody(model: string, schema: object, content: object[]) {
  return JSON.stringify({
    model,
    input: [{ type: "user_input", content }],
    response_format: { type: "text", mime_type: "application/json", schema },
    store: false,
  });
}

async function requestGeminiJson(
  apiKey: string,
  primaryModel: string,
  schema: object,
  content: object[],
  timeoutMs: number,
) {
  // `timeoutMs` is a budget for the whole provider operation, not for every retry.
  // Otherwise three slow attempts can outlive the Server Action that owns them and leave
  // the persisted job in `running` until the stale-job recovery window is reached.
  const deadline = Date.now() + timeoutMs;

  const models = geminiModelCandidates(primaryModel, process.env.GEMINI_FALLBACK_MODEL);
  let lastFailure: AiProviderError | null = null;

  for (const [modelIndex, model] of models.entries()) {
    const body = buildBody(model, schema, content);

    for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt += 1) {
      const remainingMs = deadline - Date.now();
      if (remainingMs <= 0) throw timeoutFailure();

      try {
        const response = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/interactions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
            },
            body,
            signal: AbortSignal.timeout(requestBudgetMs(remainingMs, timeoutMs, modelIndex, models.length)),
          },
        );
        const payload: unknown = await readJson(response);

        if (response.ok) {
          const result = readGeminiJson(payload);
          return { ...result, model };
        }

        lastFailure = classifyGeminiFailure(
          response.status,
          payload,
          response.headers.get("retry-after"),
        );
      } catch (error) {
        lastFailure = normalizeAiFailure(error) ?? new AiProviderError({
          kind: "unavailable",
          retryable: true,
          detail: error instanceof Error ? error.message : "network_error",
        });
      }

      if (!lastFailure.retryable || attempt === MAX_ATTEMPTS_PER_MODEL) break;
      const delayMs = retryDelayMs(attempt, lastFailure.retryAfterMs);
      if (Date.now() + delayMs >= deadline) throw timeoutFailure();
      await wait(delayMs);
    }

    const hasFallback = modelIndex < models.length - 1;
    if (!hasFallback || !canTryFallback(lastFailure)) break;
    console.warn(JSON.stringify({
      event: "ai_provider_fallback",
      provider: "gemini",
      fromModel: model,
      toModel: models[modelIndex + 1],
      reason: lastFailure?.kind ?? "unknown",
    }));
  }

  throw lastFailure ?? new AiProviderError({ kind: "unavailable", retryable: true });
}

function readGeminiJson(payload: unknown) {
  if (!isRecord(payload)) throw new Error("gemini_invalid_response");
  if (payload.status === "failed") {
    throw new AiProviderError({
      kind: "invalid_response",
      detail: readEmbeddedError(payload) ?? "gemini_failed",
    });
  }
  if (!Array.isArray(payload.steps)) {
    throw new Error("gemini_empty_response");
  }

  const text = payload.steps
    .flatMap((step) => (isRecord(step) && Array.isArray(step.content) ? step.content : []))
    .flatMap((content) =>
      isRecord(content) && content.type === "text" && typeof content.text === "string"
        ? [content.text]
        : [],
    )
    .join("")
    .trim();
  if (!text) throw new Error("gemini_empty_response");

  try {
    return { value: JSON.parse(text) as unknown, usage: readUsage(payload.usage) };
  } catch {
    throw new Error("gemini_invalid_json");
  }
}

function readUsage(value: unknown): GeminiUsage | null {
  if (!isRecord(value)) return null;
  return {
    input: readNumber(value.total_input_tokens),
    output: readNumber(value.total_output_tokens),
    thoughts: readNumber(value.total_thought_tokens),
    total: readNumber(value.total_tokens),
  };
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readEmbeddedError(payload: Record<string, unknown>) {
  if (!isRecord(payload.error)) return null;
  return typeof payload.error.message === "string" ? payload.error.message : null;
}

export function geminiModelCandidates(primaryModel: string, configuredFallback?: string) {
  const fallback = configuredFallback?.trim() || DEFAULT_FALLBACK_MODEL;
  return [...new Set([primaryModel.trim(), fallback].filter(Boolean))];
}

export function retryDelayMs(attempt: number, providerDelayMs: number | null) {
  if (providerDelayMs !== null) return Math.min(providerDelayMs, 15_000);
  const exponential = 1_000 * 2 ** Math.max(0, attempt - 1);
  const jitter = Math.floor(Math.random() * 350);
  return exponential + jitter;
}

function requestBudgetMs(remainingMs: number, totalBudgetMs: number, modelIndex: number, modelCount: number) {
  if (modelIndex >= modelCount - 1) return remainingMs;
  const reserveForFallback = Math.min(totalBudgetMs === GEMINI_VIDEO_TIMEOUT_MS ? 45_000 : 12_000, remainingMs / 2);
  return Math.max(1_000, remainingMs - reserveForFallback);
}

function canTryFallback(failure: AiProviderError | null) {
  return failure !== null && [
    "rate_limit",
    "quota_exhausted",
    "timeout",
    "unavailable",
    "invalid_response",
  ].includes(failure.kind);
}

async function readJson(response: Response) {
  try {
    return await response.json() as unknown;
  } catch {
    throw new AiProviderError({
      kind: response.ok ? "invalid_response" : "unavailable",
      status: response.status,
      retryable: !response.ok && response.status >= 500,
      detail: "response_was_not_json",
    });
  }
}

function timeoutFailure() {
  return new AiProviderError({ kind: "timeout", retryable: true, detail: "gemini_timeout" });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
