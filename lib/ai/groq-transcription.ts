import type { AnalysisMoment } from "@/lib/content/analysis";

const MODEL = "whisper-large-v3-turbo";

/** Transcribe el audio y conserva un punto de tiempo por segmento. */
export async function transcribeReel(video: Buffer, apiKey: string): Promise<AnalysisMoment[]> {
  const form = new FormData();
  form.append("file", new Blob([Uint8Array.from(video)], { type: "video/mp4" }), "reel.mp4");
  form.append("model", MODEL);
  form.append("language", "es");
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "segment");

  const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
    signal: AbortSignal.timeout(60_000),
  });
  const payload: unknown = await response.json();

  if (!response.ok) {
    throw new Error(readProviderError(payload) ?? `groq_http_${response.status}`);
  }
  if (!isRecord(payload) || !Array.isArray(payload.segments)) {
    throw new Error("groq_invalid_transcript");
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

function readProviderError(payload: unknown) {
  if (!isRecord(payload) || !isRecord(payload.error)) return null;
  return typeof payload.error.message === "string" ? payload.error.message : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
