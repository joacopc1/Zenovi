export type AiFailureKind =
  | "rate_limit"
  | "quota_exhausted"
  | "timeout"
  | "unavailable"
  | "authentication"
  | "invalid_request"
  | "invalid_response"
  | "configuration"
  | "unknown";

export type AiProvider = "gemini" | "groq" | "gateway";

export class AiProviderError extends Error {
  readonly provider: AiProvider;
  readonly kind: AiFailureKind;
  readonly status: number | null;
  readonly retryable: boolean;
  readonly retryAfterMs: number | null;
  readonly detail: string | null;

  constructor({
    provider = "gemini",
    kind,
    status = null,
    retryable = false,
    retryAfterMs = null,
    detail = null,
  }: {
    provider?: AiProvider;
    kind: AiFailureKind;
    status?: number | null;
    retryable?: boolean;
    retryAfterMs?: number | null;
    detail?: string | null;
  }) {
    super(`${provider}_${kind}`);
    this.name = "AiProviderError";
    this.provider = provider;
    this.kind = kind;
    this.status = status;
    this.retryable = retryable;
    this.retryAfterMs = retryAfterMs;
    this.detail = detail;
  }
}

export function classifyGeminiFailure(
  status: number,
  payload: unknown,
  retryAfterHeader: string | null = null,
) {
  return classifyProviderFailure("gemini", status, payload, retryAfterHeader);
}

export function classifyGroqFailure(
  status: number,
  payload: unknown,
  retryAfterHeader: string | null = null,
) {
  return classifyProviderFailure("groq", status, payload, retryAfterHeader);
}

function classifyProviderFailure(
  provider: AiProvider,
  status: number,
  payload: unknown,
  retryAfterHeader: string | null,
) {
  const providerError = readProviderError(payload);
  const detail = providerError.message;
  const signature = [providerError.type, providerError.status, providerError.message]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const retryAfterMs = parseRetryAfterMs(retryAfterHeader);

  if (status === 401 || status === 403) {
    return new AiProviderError({ provider, kind: "authentication", status, detail });
  }
  if (status === 400 || status === 422) {
    return new AiProviderError({ provider, kind: "invalid_request", status, detail });
  }
  if (status === 408) {
    return new AiProviderError({ provider, kind: "timeout", status, retryable: true, retryAfterMs, detail });
  }
  if (status === 429) {
    const quotaExhausted = [
      "quota_exceeded",
      "quota exceeded",
      "daily quota",
      "requests per day",
      "request per day",
      "free_tier",
      "free tier",
      "prepay",
      "billing",
      "credit balance",
    ].some((marker) => signature.includes(marker));

    return new AiProviderError({
      provider,
      kind: quotaExhausted ? "quota_exhausted" : "rate_limit",
      status,
      retryable: !quotaExhausted,
      retryAfterMs,
      detail,
    });
  }
  if (status >= 500) {
    return new AiProviderError({ provider, kind: "unavailable", status, retryable: true, retryAfterMs, detail });
  }

  return new AiProviderError({ provider, kind: "unknown", status, detail });
}

export function parseRetryAfterMs(value: string | null, now = Date.now()) {
  if (value === null) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.round(seconds * 1_000);

  const at = Date.parse(value);
  if (!Number.isFinite(at)) return null;
  return Math.max(0, at - now);
}

export function userMessageForAiFailure(error: unknown, subject: string) {
  const failure = normalizeAiFailure(error);
  switch (failure?.kind) {
    case "rate_limit":
      return `El servicio de IA está temporalmente ocupado. Zenovi ya reintentó automáticamente; podés volver a pedir ${subject} en unos minutos.`;
    case "quota_exhausted":
      return `La cuota de IA de este proyecto se agotó. Hay que esperar a que se reinicie o habilitar facturación antes de volver a pedir ${subject}.`;
    case "timeout":
      return `El servicio de IA tardó demasiado. Podés volver a pedir ${subject}.`;
    case "unavailable":
      return `El servicio de IA no está disponible en este momento. Podés volver a pedir ${subject} más tarde.`;
    case "authentication":
      return "La conexión con el servicio de IA necesita ser revisada en la configuración.";
    case "configuration":
      return `${capitalize(subject)} todavía no está configurado en este entorno.`;
    case "invalid_request":
    case "invalid_response":
      return `El servicio de IA no pudo devolver ${subject} con el formato esperado.`;
    default:
      return null;
  }
}

export function normalizeAiFailure(
  error: unknown,
  provider: AiProvider = "gemini",
): AiProviderError | null {
  if (error instanceof AiProviderError) return error;
  if (!(error instanceof Error)) return null;

  if (error.message === "gemini_timeout" || error.name === "TimeoutError") {
    return new AiProviderError({ provider, kind: "timeout", retryable: true, detail: error.message });
  }
  if (error.message.startsWith("missing_")) {
    return new AiProviderError({ provider, kind: "configuration", detail: error.message });
  }
  if (error.message.startsWith("gemini_invalid_") || error.message === "gemini_empty_response") {
    return new AiProviderError({ provider, kind: "invalid_response", detail: error.message });
  }
  return null;
}

function readProviderError(payload: unknown) {
  if (!isRecord(payload) || !isRecord(payload.error)) {
    return { message: null, status: null, type: null };
  }
  return {
    message: typeof payload.error.message === "string" ? payload.error.message : null,
    status: typeof payload.error.status === "string" ? payload.error.status : null,
    type: [payload.error.type, payload.error.code]
      .filter((value): value is string => typeof value === "string")
      .join(" ") || null,
  };
}

function capitalize(value: string) {
  return value.length > 0 ? value[0].toUpperCase() + value.slice(1) : value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
