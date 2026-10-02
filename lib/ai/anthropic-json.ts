import "server-only";

import { anthropic } from "@ai-sdk/anthropic";
import { generateText, jsonSchema, Output } from "ai";
import { ANALYSIS_FALLBACK_MODEL } from "./models.ts";
import { AiProviderError } from "./provider-error.ts";
import { tokenUsageFrom } from "../credits/record-usage.ts";
import { addMeteredUsage } from "../credits/usage-meter.ts";

const FALLBACK_TIMEOUT_MS = 90_000;

export type FallbackImage = {
  data: Buffer | URL | string;
  mediaType?: string;
  label?: string;
};

type GenerateFallbackJsonInput = {
  prompt: string;
  schema: object;
  images?: FallbackImage[];
};

/**
 * Respaldo de los análisis cuando Gemini no puede completarlos: Claude, directo con
 * Anthropic. Sólo recibe imágenes: nunca presenta una miniatura o una transcripción como si
 * hubiera visto el video completo.
 */
export async function generateAnthropicJson({
  prompt,
  schema,
  images = [],
}: GenerateFallbackJsonInput) {
  try {
    const result = await generateText({
      model: anthropic(ANALYSIS_FALLBACK_MODEL),
      messages: [{
        role: "user",
        content: [
          { type: "text", text: prompt },
          ...images.flatMap((image) => [
            ...(image.label ? [{ type: "text" as const, text: image.label }] : []),
            {
              type: "image" as const,
              image: image.data,
              ...(image.mediaType ? { mediaType: image.mediaType } : {}),
            },
          ]),
        ],
      }],
      output: Output.object({
        schema: jsonSchema(schema as Parameters<typeof jsonSchema>[0]),
        name: "zenovi_analysis",
        description: "Análisis accionable de contenido para una marca personal",
      }),
      maxRetries: 1,
      timeout: { totalMs: FALLBACK_TIMEOUT_MS },
    });

    // Se mide con el modelo pedido: el id que devuelve la respuesta puede traer una fecha y no tener precio.
    addMeteredUsage(ANALYSIS_FALLBACK_MODEL, tokenUsageFrom(result.totalUsage));
    return {
      value: result.output as unknown,
      model: result.response.modelId || ANALYSIS_FALLBACK_MODEL,
    };
  } catch (error) {
    throw normalizeFallbackFailure(error);
  }
}

function normalizeFallbackFailure(error: unknown) {
  if (error instanceof AiProviderError) return error;
  const status = readStatus(error);
  const detail = error instanceof Error ? error.message : "anthropic_error";

  if (status === 401 || status === 403) {
    return new AiProviderError({ provider: "anthropic", kind: "authentication", status, detail });
  }
  if (status === 402 || (status === 429 && /credit|billing|quota/i.test(detail))) {
    return new AiProviderError({ provider: "anthropic", kind: "quota_exhausted", status, detail });
  }
  if (status === 429) {
    return new AiProviderError({ provider: "anthropic", kind: "rate_limit", status, retryable: true, detail });
  }
  if (status !== null && status >= 500) {
    return new AiProviderError({ provider: "anthropic", kind: "unavailable", status, retryable: true, detail });
  }
  if (error instanceof Error && (error.name === "TimeoutError" || /timeout/i.test(error.message))) {
    return new AiProviderError({ provider: "anthropic", kind: "timeout", retryable: true, detail });
  }
  return new AiProviderError({
    provider: "anthropic",
    kind: status === 400 || status === 422 ? "invalid_request" : "invalid_response",
    status,
    detail,
  });
}

function readStatus(error: unknown) {
  if (typeof error !== "object" || error === null) return null;
  for (const key of ["statusCode", "status"] as const) {
    const value = Reflect.get(error, key);
    if (typeof value === "number") return value;
  }
  const cause = Reflect.get(error, "cause");
  if (cause !== error) return readStatus(cause);
  return null;
}
