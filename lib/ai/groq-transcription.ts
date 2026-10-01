import type { AnalysisMoment } from "@/lib/content/analysis";
import {
  AiProviderError,
  classifyGroqFailure,
  normalizeAiFailure,
} from "./provider-error.ts";

const MODEL = "whisper-large-v3-turbo";
const TIMEOUT_MS = 60_000;
const MAX_ATTEMPTS = 2;

/** Transcribe el audio y conserva un punto de tiempo por segmento. */
export async function transcribeReel(video: Buffer, apiKey: string): Promise<AnalysisMoment[]> {
  const deadline = Date.now() + TIMEOUT_MS;
  let lastFailure: AiProviderError | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) throw timeoutFailure();

    try {
      const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: buildForm(video),
        signal: AbortSignal.timeout(attempt === 1 ? Math.min(45_000, remainingMs) : remainingMs),
      });
      const payload = await readJson(response);

      if (response.ok) return readTranscript(payload);
      lastFailure = classifyGroqFailure(
        response.status,
        payload,
        response.headers.get("retry-after"),
      );
    } catch (error) {
      lastFailure = normalizeAiFailure(error, "groq") ?? new AiProviderError({
        provider: "groq",
        kind: "unavailable",
        retryable: true,
        detail: error instanceof Error ? error.message : "network_error",
      });
    }

    if (!lastFailure.retryable || attempt === MAX_ATTEMPTS) break;
    const delayMs = Math.min(lastFailure.retryAfterMs ?? attempt * 1_000, 15_000);
    if (Date.now() + delayMs >= deadline) throw timeoutFailure();
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw lastFailure ?? new AiProviderError({ provider: "groq", kind: "unavailable", retryable: true });
}

function buildForm(video: Buffer) {
  const form = new FormData();
  form.append("file", new Blob([Uint8Array.from(video)], { type: "video/mp4" }), "reel.mp4");
  form.append("model", MODEL);
  form.append("language", "es");
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "segment");
  return form;
}

function readTranscript(payload: unknown) {
  if (!isRecord(payload) || !Array.isArray(payload.segments)) {
    throw new AiProviderError({ provider: "groq", kind: "invalid_response", detail: "groq_invalid_transcript" });
  }

  return payload.segments.flatMap((segment) => {
    if (
      !isRecord(segment) ||
      typeof segment.start !== "number" ||
      !Number.isFinite(segment.start) ||
      typeof segment.text !== "string" ||
      !segment.text.trim()
    ) {
      return [];
    }

    return [{ atMs: Math.max(0, Math.round(segment.start * 1000)), quote: segment.text.trim() }];
  });
}

async function readJson(response: Response) {
  try {
    return await response.json() as unknown;
  } catch {
    throw new AiProviderError({
      provider: "groq",
      kind: response.ok ? "invalid_response" : "unavailable",
      status: response.status,
      retryable: !response.ok && response.status >= 500,
      detail: "response_was_not_json",
    });
  }
}

function timeoutFailure() {
  return new AiProviderError({
    provider: "groq",
    kind: "timeout",
    retryable: true,
    detail: "groq_timeout",
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
