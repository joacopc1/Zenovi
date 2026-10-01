import "server-only";

import type { LanguageModelUsage } from "ai";
import { createAdminClient } from "@/lib/supabase/admin";
import { usageCostUsd, usdToCredits, type TokenUsage } from "./pricing";

export type AiFeature = "director_chat" | "director_title" | "reel_analysis" | "story_analysis" | "reel_script";

/** Lo que informa el SDK, en la forma que cobra el precio: sin caché, leído y escrito por separado. */
export function tokenUsageFrom(usage: LanguageModelUsage): TokenUsage {
  const cacheReadTokens = usage.inputTokenDetails.cacheReadTokens ?? 0;
  const cacheWriteTokens = usage.inputTokenDetails.cacheWriteTokens ?? 0;
  return {
    inputTokens: usage.inputTokenDetails.noCacheTokens
      ?? Math.max(0, (usage.inputTokens ?? 0) - cacheReadTokens - cacheWriteTokens),
    cacheReadTokens,
    cacheWriteTokens,
    outputTokens: usage.outputTokens ?? 0,
  };
}

/**
 * Deja el costo real de una operación con IA. Lo escribe el servidor con la clave de
 * servicio: nadie puede descontarse ni regalarse créditos desde el navegador.
 */
export async function recordAiUsage({
  workspaceId,
  userId,
  feature,
  model,
  usage,
  referenceId,
}: {
  workspaceId: string;
  userId: string | null;
  feature: AiFeature;
  model: string;
  usage: LanguageModelUsage;
  referenceId?: string;
}) {
  const tokens = tokenUsageFrom(usage);
  const costUsd = usageCostUsd(model, tokens);
  const { error } = await createAdminClient().from("ai_usage_events").insert({
    workspace_id: workspaceId,
    user_id: userId,
    feature,
    model,
    input_tokens: tokens.inputTokens,
    cached_input_tokens: tokens.cacheReadTokens + tokens.cacheWriteTokens,
    output_tokens: tokens.outputTokens,
    cost_usd: costUsd,
    credits: usdToCredits(costUsd),
    reference_id: referenceId ?? null,
  });
  if (error) {
    // El uso ya ocurrió: perder el registro es preferible a romper la respuesta, pero se avisa.
    console.error(JSON.stringify({ event: "credits", error: "usage_record_failed", feature, code: error.code }));
  }
}
