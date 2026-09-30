// Un 429 exige esperar la ventana indicada por el proveedor. Reintentarlo dos segundos
// despues sólo consume más cuota y demora el mensaje que necesita la interfaz.
const RETRYABLE_STATUSES = new Set([500, 502, 503, 504]);
const INLINE_REQUEST_LIMIT = 20 * 1024 * 1024;
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

export type GeminiUsage = {
  input: number | null;
  output: number | null;
  thoughts: number | null;
  total: number | null;
};

/** Pide JSON estructurado a Gemini con un video inline y reintenta sólo fallos pasajeros. */
export async function generateGeminiVideoJson({
  apiKey,
  model,
  video,
  prompt,
  schema,
}: GenerateGeminiVideoJsonInput): Promise<{ value: unknown; usage: GeminiUsage | null }> {
  const encodedVideo = video.toString("base64");
  const body = buildBody(model, schema, [
    { type: "text", text: prompt },
    {
      type: "video",
      data: encodedVideo,
      mime_type: "video/mp4",
      processing: "static",
    },
  ]);

  if (Buffer.byteLength(body) >= INLINE_REQUEST_LIMIT) {
    throw new Error("video_too_large_for_inline_analysis");
  }

  return requestGeminiJson(apiKey, body, GEMINI_VIDEO_TIMEOUT_MS);
}

/** Clasifica texto estructurado sin volver a enviar ni procesar el video. */
export async function generateGeminiTextJson({
  apiKey,
  model,
  prompt,
  schema,
}: GenerateGeminiTextJsonInput): Promise<{ value: unknown; usage: GeminiUsage | null }> {
  return requestGeminiJson(
    apiKey,
    buildBody(model, schema, [{ type: "text", text: prompt }]),
    GEMINI_TEXT_TIMEOUT_MS,
  );
}

function buildBody(model: string, schema: object, content: object[]) {
  return JSON.stringify({
    model,
    input: [{ type: "user_input", content }],
    response_format: { type: "text", mime_type: "application/json", schema },
    store: false,
  });
}

async function requestGeminiJson(apiKey: string, body: string, timeoutMs: number) {
  // `timeoutMs` is a budget for the whole provider operation, not for every retry.
  // Otherwise three slow attempts can outlive the Server Action that owns them and leave
  // the persisted job in `running` until the stale-job recovery window is reached.
  const deadline = Date.now() + timeoutMs;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) throw new Error("gemini_timeout");

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body,
        signal: AbortSignal.timeout(remainingMs),
      },
    );
    const payload: unknown = await response.json();

    if (response.ok) return readGeminiJson(payload);

    const message = readProviderError(payload) ?? `gemini_http_${response.status}`;
    if (!RETRYABLE_STATUSES.has(response.status) || attempt === 3) {
      throw new Error(message);
    }

    const retryDelayMs = attempt * 2_000;
    if (Date.now() + retryDelayMs >= deadline) throw new Error("gemini_timeout");
    await wait(retryDelayMs);
  }

  throw new Error("gemini_unavailable");
}

function readGeminiJson(payload: unknown) {
  if (!isRecord(payload)) throw new Error("gemini_invalid_response");
  if (payload.status === "failed") {
    throw new Error(readProviderError(payload) ?? "gemini_failed");
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

function readProviderError(payload: unknown) {
  if (!isRecord(payload) || !isRecord(payload.error)) return null;
  return typeof payload.error.message === "string" ? payload.error.message : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
