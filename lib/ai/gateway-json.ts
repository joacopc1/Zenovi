import "server-only";

import { generateText, jsonSchema, Output } from "ai";
import { gatewayModelCandidates } from "./gateway-config.ts";
import { AiProviderError } from "./provider-error.ts";

const GATEWAY_TIMEOUT_MS = 90_000;

export type GatewayImage = {
  data: Buffer | URL | string;
  mediaType?: string;
  label?: string;
};

type GenerateGatewayJsonInput = {
  prompt: string;
  schema: object;
  images?: GatewayImage[];
};

/**
 * Respaldo multimodelo para cuando Gemini no puede completar una operación.
 * Sólo recibe imágenes: nunca presenta una miniatura o una transcripción como si el
 * proveedor alternativo hubiera inspeccionado el video completo.
 */
export async function generateGatewayJson({
  prompt,
  schema,
  images = [],
}: GenerateGatewayJsonInput) {
  const [model, ...fallbacks] = gatewayModelCandidates(
    process.env.AI_GATEWAY_MODEL,
    process.env.AI_GATEWAY_FALLBACK_MODEL,
  );

  try {
    const result = await generateText({
      model,
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
      timeout: { totalMs: GATEWAY_TIMEOUT_MS },
      providerOptions: {
        gateway: {
          ...(fallbacks.length > 0 ? { models: fallbacks } : {}),
          has: ["structured-output", ...(images.length > 0 ? ["vision" as const] : [])],
        },
      },
    });

    return {
      value: result.output as unknown,
      model: result.response.modelId || model,
    };
  } catch (error) {
    throw normalizeGatewayFailure(error);
  }
}

function normalizeGatewayFailure(error: unknown) {
  if (error instanceof AiProviderError) return error;
  const status = readStatus(error);
  const detail = error instanceof Error ? error.message : "gateway_error";

  if (status === 401 || status === 403) {
    return new AiProviderError({ provider: "gateway", kind: "authentication", status, detail });
  }
  if (status === 402 || (status === 429 && /credit|billing|quota/i.test(detail))) {
    return new AiProviderError({ provider: "gateway", kind: "quota_exhausted", status, detail });
  }
  if (status === 429) {
    return new AiProviderError({ provider: "gateway", kind: "rate_limit", status, retryable: true, detail });
  }
  if (status !== null && status >= 500) {
    return new AiProviderError({ provider: "gateway", kind: "unavailable", status, retryable: true, detail });
  }
  if (error instanceof Error && (error.name === "TimeoutError" || /timeout/i.test(error.message))) {
    return new AiProviderError({ provider: "gateway", kind: "timeout", retryable: true, detail });
  }
  return new AiProviderError({
    provider: "gateway",
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
