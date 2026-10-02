"use server";

import { revalidatePath } from "next/cache";
import { analyzeStorySequence } from "@/lib/ai/story-analysis";
import { ANALYSIS_MODEL } from "@/lib/ai/models";
import { userMessageForAiFailure } from "@/lib/ai/provider-error";
import { isAnalysisStale } from "@/lib/content/analysis";
import { buildCohort } from "@/lib/content/library";
import { storyAnalysisBlocker } from "@/lib/content/analysis-readiness";
import { buildStorySequences } from "@/lib/content/story-sequences";
import { ACTION_CREDITS } from "@/lib/credits/pricing";
import { actionCreditsBlocker, chargeAction } from "@/lib/credits/record-usage";
import { meterAiUsage } from "@/lib/credits/usage-meter";
import { RATE_LIMITED_MESSAGE, takeRateLimit } from "@/lib/security/rate-limit";
import { getInstagramContentLibrary } from "@/lib/data/instagram-content";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { RequestAnalysisResult } from "./actions";

export async function requestStorySequenceAnalysis(
  mediaId: string,
  refresh = false,
): Promise<RequestAnalysisResult> {
  if (!isUuid(mediaId)) return { status: "error", message: "La Historia no es válida." };

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return { status: "error", message: "Tu sesión venció. Volvé a iniciar sesión." };
  }
  const { data: workspace } = await supabase.from("workspaces").select("id").limit(1).maybeSingle();
  if (!workspace) return { status: "error", message: "No encontramos tu workspace." };

  const library = await getInstagramContentLibrary(workspace.id);
  if (!library) return { status: "error", message: "No encontramos tu cuenta de Instagram." };
  const cohort = buildCohort(library.items, "story");
  const sequence = buildStorySequences(cohort).find((candidate) =>
    candidate.stories.some((story) => story.id === mediaId),
  );
  if (!sequence) return { status: "error", message: "No encontramos esa secuencia." };
  const blocker = storyAnalysisBlocker(sequence);
  if (blocker) return { status: "error", message: blocker };

  const anchorId = sequence.stories[0].id;
  const admin = createAdminClient();
  const { data: current, error: currentError } = await admin
    .from("content_analyses")
    .select("status, can_retry, started_at")
    .eq("workspace_id", workspace.id)
    .eq("instagram_media_id", anchorId)
    .maybeSingle();
  if (currentError) return databaseError("read_failed", mediaId);
  if (current?.status === "ready" && !refresh) return { status: "ready" };
  if ((current?.status === "queued" || current?.status === "running") && !isAnalysisStale(current.started_at)) {
    return { status: "in_progress" };
  }
  if (current?.status === "failed" && !current.can_retry) {
    return { status: "error", message: "Este análisis no se puede volver a intentar." };
  }
  const noCredits = await actionCreditsBlocker(workspace.id, "story_analysis");
  if (noCredits) return { status: "error", message: noCredits };
  if (!(await takeRateLimit("ai_action", workspace.id))) return { status: "error", message: RATE_LIMITED_MESSAGE };

  const startedAt = new Date().toISOString();
  const startError = current
    ? (await admin.from("content_analyses").update({
        status: "running",
        pipeline_version: null,
        result: null,
        failure_reason: null,
        can_retry: true,
        credits_spent: 0,
        started_at: startedAt,
        completed_at: null,
      }).eq("workspace_id", workspace.id).eq("instagram_media_id", anchorId)).error
    : (await supabase.from("content_analyses").insert({
        workspace_id: workspace.id,
        instagram_media_id: anchorId,
        status: "running",
        credits_spent: 0,
        started_at: startedAt,
      })).error;

  if (startError) {
    if (startError.code === "23505") return { status: "in_progress" };
    return databaseError("start_failed", mediaId);
  }
  revalidatePath(`/content/${mediaId}`);

  try {
    const { value: analysis, costUsd } = await meterAiUsage(() => analyzeStorySequence(workspace.id, sequence));
    const { error } = await admin.from("content_analyses").update({
      status: "ready",
      pipeline_version: analysis.pipelineVersion,
      result: analysis,
      failure_reason: null,
      can_retry: true,
      credits_spent: ACTION_CREDITS.story_analysis,
      completed_at: analysis.completedAt,
    }).eq("workspace_id", workspace.id).eq("instagram_media_id", anchorId);

    if (error) return databaseError("save_failed", mediaId);
    // Se cobra lo que quedó guardado: un análisis que no se pudo guardar no se paga.
    await chargeAction({
      workspaceId: workspace.id,
      userId: authData.user.id,
      action: "story_analysis",
      model: ANALYSIS_MODEL,
      costUsd,
      referenceId: anchorId,
    });
    revalidatePath(`/content/${mediaId}`);
    return { status: "ready" };
  } catch (error) {
    const message = failureMessage(error);
    console.error(JSON.stringify({
      event: "story_analysis",
      error: "pipeline_failed",
      mediaId,
      detail: error instanceof Error ? error.message : "unknown",
    }));
    await admin.from("content_analyses").update({
      status: "failed",
      result: null,
      failure_reason: message,
      can_retry: true,
      credits_spent: 0,
      completed_at: null,
    }).eq("workspace_id", workspace.id).eq("instagram_media_id", anchorId);
    revalidatePath(`/content/${mediaId}`);
    return { status: "error", message };
  }
}

function failureMessage(error: unknown) {
  const code = error instanceof Error ? error.message : "unknown";
  if (code === "fresh_story_media_unavailable" || code.startsWith("story_media_download_http_")) {
    return "Instagram ya no está entregando el archivo de una o más Historias de esta secuencia.";
  }
  if (code === "story_sequence_too_large_for_inline_analysis") {
    return "La secuencia es demasiado pesada para analizarla completa en este momento.";
  }
  if (code === "story_media_type_unsupported") {
    return "Una Historia usa un formato que el analizador todavía no admite.";
  }
  const aiMessage = userMessageForAiFailure(error, "el análisis de la secuencia");
  if (aiMessage) return aiMessage;
  return "No pudimos completar el análisis de la secuencia. No se descontó ningún crédito.";
}

function databaseError(event: string, mediaId: string): RequestAnalysisResult {
  console.error(JSON.stringify({ event: "story_analysis", error: event, mediaId }));
  return { status: "error", message: "No pudimos guardar el estado del análisis." };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
