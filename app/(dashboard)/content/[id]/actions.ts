"use server";

import { revalidatePath } from "next/cache";
import { analyzeReel } from "@/lib/ai/reel-analysis";
import { reelAnalysisBlocker } from "@/lib/content/analysis-readiness";
import { generateReelScript } from "@/lib/ai/reel-script";
import { userMessageForAiFailure } from "@/lib/ai/provider-error";
import {
  isAnalysisStale,
  parseReelAnalysis,
  type ReelAnalysis,
} from "@/lib/content/analysis";
import { parseReelScript } from "@/lib/content/script";
import { buildCohort, type RankedContentItem } from "@/lib/content/library";
import { durationMsFromSeconds } from "@/lib/content/media-duration";
import { getInstagramContentLibrary } from "@/lib/data/instagram-content";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type RequestAnalysisResult = {
  status: "idle" | "ready" | "in_progress" | "error";
  message?: string;
};

export type RequestScriptResult = RequestAnalysisResult;

/**
 * Conserva la duración que el navegador verificó desde el archivo reproducible.
 * La lectura autenticada queda protegida por RLS: un id recibido del cliente no alcanza
 * para encontrar —y por lo tanto modificar— contenido de otro workspace.
 */
export async function persistReelDuration(mediaId: string, seconds: number): Promise<void> {
  if (!isUuid(mediaId)) return;
  const durationMs = durationMsFromSeconds(seconds);
  if (durationMs === null) return;

  const supabase = await createClient();
  const { data: reel, error: readError } = await supabase
    .from("instagram_media")
    .select("id, media_product_type, duration_ms")
    .eq("id", mediaId)
    .maybeSingle();

  if (
    readError ||
    !reel ||
    reel.media_product_type?.toUpperCase() !== "REELS" ||
    reel.duration_ms === durationMs
  ) {
    return;
  }

  const { error } = await createAdminClient()
    .from("instagram_media")
    .update({ duration_ms: durationMs })
    .eq("id", mediaId);

  if (error) {
    console.error(JSON.stringify({ event: "media_duration", error: "save_failed", mediaId }));
  }
}

export async function requestReelScript(
  mediaId: string,
): Promise<RequestScriptResult> {
  if (!isUuid(mediaId)) return { status: "error", message: "La pieza no es válida." };

  const context = await getAuthorizedReel(mediaId);
  if (!context.ok) return context.error;

  const { workspaceId, item, supabase } = context;
  const admin = createAdminClient();
  const { data: current, error: currentError } = await admin
    .from("content_scripts")
    .select("status, can_retry, started_at, result")
    .eq("workspace_id", workspaceId)
    .eq("instagram_media_id", mediaId)
    .maybeSingle();

  if (currentError) return databaseError("script_read_failed", mediaId);
  if (current?.status === "ready") return { status: "ready" };
  if (
    (current?.status === "queued" || current?.status === "running") &&
    !isAnalysisStale(current.started_at)
  ) {
    return { status: "in_progress" };
  }
  if (current?.status === "failed" && !current.can_retry) {
    return { status: "error", message: "Este guion no se puede volver a intentar." };
  }

  const startedAt = new Date().toISOString();
  const startError = current
    ? (
        await admin
          .from("content_scripts")
          .update({
            status: "running",
            pipeline_version: null,
            result: null,
            failure_reason: null,
            can_retry: true,
            started_at: startedAt,
            completed_at: null,
          })
          .eq("workspace_id", workspaceId)
          .eq("instagram_media_id", mediaId)
      ).error
    : (
        await supabase.from("content_scripts").insert({
          workspace_id: workspaceId,
          instagram_media_id: mediaId,
          status: "running",
          started_at: startedAt,
        })
      ).error;

  if (startError) {
    if (startError.code === "23505") return { status: "in_progress" };
    return databaseError("script_start_failed", mediaId);
  }

  revalidatePath(`/content/${mediaId}`);

  try {
    // Un análisis anterior ya contiene la transcripción canónica. Reutilizarla evita
    // volver a descargar el Reel y volver a pagar Whisper sólo para clasificar dos
    // límites narrativos.
    const storedScript = parseReelScript(current?.result);
    const { data: analysisRow } = storedScript
      ? { data: null }
      : await admin
      .from("content_analyses")
      .select("result")
      .eq("workspace_id", workspaceId)
      .eq("instagram_media_id", mediaId)
      .eq("status", "ready")
      .maybeSingle();
    const storedAnalysis = parseReelAnalysis(analysisRow?.result);
    const script = await generateReelScript(
      workspaceId,
      item,
      storedScript?.transcript ?? storedAnalysis?.transcript,
    );
    const { error } = await admin
      .from("content_scripts")
      .update({
        status: "ready",
        pipeline_version: script.pipelineVersion,
        result: script,
        failure_reason: null,
        can_retry: true,
        completed_at: script.completedAt,
      })
      .eq("workspace_id", workspaceId)
      .eq("instagram_media_id", mediaId);

    if (error) {
      await markScriptFailed(admin, workspaceId, mediaId, "El guion terminó, pero no pudimos guardarlo.");
      return databaseError("script_save_failed", mediaId);
    }
    revalidatePath(`/content/${mediaId}`);
    return { status: "ready" };
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "content_script",
        error: "pipeline_failed",
        mediaId,
        detail: error instanceof Error ? error.message : "unknown",
      }),
    );
    const message = scriptFailureMessage(error);
    await markScriptFailed(admin, workspaceId, mediaId, message);
    revalidatePath(`/content/${mediaId}`);
    return { status: "error", message };
  }
}

/**
 * Analiza una pieza que pertenece al workspace autenticado y persiste un único resultado.
 *
 * El trabajo corre en el servidor porque usa credenciales de Meta, Groq y Gemini. Cada
 * acceso administrativo vuelve a estar acotado por workspace y media: recibir un id del
 * navegador nunca alcanza para leer o modificar contenido ajeno.
 */
export async function requestReelAnalysis(
  mediaId: string,
  refresh = false,
): Promise<RequestAnalysisResult> {
  if (!isUuid(mediaId)) return { status: "error", message: "La pieza no es válida." };

  const context = await getAuthorizedReel(mediaId);
  if (!context.ok) return context.error;
  const { workspaceId, item, supabase } = context;
  const blocker = reelAnalysisBlocker(item.views);
  if (blocker) return { status: "error", message: blocker };

  const admin = createAdminClient();
  const { data: current, error: currentError } = await admin
    .from("content_analyses")
    .select("status, can_retry, started_at")
    .eq("workspace_id", workspaceId)
    .eq("instagram_media_id", mediaId)
    .maybeSingle();

  if (currentError) return databaseError("read_failed", mediaId);
  if (current?.status === "ready" && !refresh) return { status: "ready" };
  if (
    (current?.status === "queued" || current?.status === "running") &&
    !isAnalysisStale(current.started_at)
  ) {
    return { status: "in_progress" };
  }
  if (current?.status === "failed" && !current.can_retry) {
    return { status: "error", message: "Este análisis no se puede volver a intentar." };
  }

  const refreshingReadyAnalysis = current?.status === "ready" && refresh;
  const startedAt = new Date().toISOString();
  const startError = refreshingReadyAnalysis
    ? null
    : current
    ? (
        await admin
          .from("content_analyses")
          .update({
            status: "running",
            pipeline_version: null,
            result: null,
            failure_reason: null,
            can_retry: true,
            credits_spent: 0,
            started_at: startedAt,
            completed_at: null,
          })
          .eq("workspace_id", workspaceId)
          .eq("instagram_media_id", mediaId)
      ).error
    : (
        await supabase.from("content_analyses").insert({
          workspace_id: workspaceId,
          instagram_media_id: mediaId,
          status: "running",
          credits_spent: 0,
          started_at: startedAt,
        })
      ).error;

  if (startError) {
    if (startError.code === "23505") return { status: "in_progress" };
    return databaseError("start_failed", mediaId);
  }

  if (!refreshingReadyAnalysis) revalidatePath(`/content/${mediaId}`);

  try {
    const { data: scriptRow } = await admin
      .from("content_scripts")
      .select("result")
      .eq("workspace_id", workspaceId)
      .eq("instagram_media_id", mediaId)
      .eq("status", "ready")
      .maybeSingle();
    const storedScript = parseReelScript(scriptRow?.result);
    const analysis = await analyzeReel(workspaceId, item, storedScript?.transcript);
    const { error } = await admin
      .from("content_analyses")
      .update({
        status: "ready",
        pipeline_version: analysis.pipelineVersion,
        result: analysis,
        failure_reason: null,
        can_retry: true,
        credits_spent: 0,
        completed_at: analysis.completedAt,
      })
      .eq("workspace_id", workspaceId)
      .eq("instagram_media_id", mediaId);

    if (error) {
      if (!refreshingReadyAnalysis) {
        await markAnalysisFailed(
          admin,
          workspaceId,
          mediaId,
          "El análisis terminó, pero no pudimos guardar el resultado. Probá nuevamente.",
        );
        revalidatePath(`/content/${mediaId}`);
      }
      return databaseError("save_failed", mediaId);
    }

    if (!storedScript) {
      await persistScriptGeneratedByAnalysis({
        admin,
        workspaceId,
        mediaId,
        item,
        transcript: analysis.transcript,
        startedAt,
      });
    }
    revalidatePath(`/content/${mediaId}`);
    return { status: "ready" };
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "content_analysis",
        error: "pipeline_failed",
        mediaId,
        detail: error instanceof Error ? error.message : "unknown",
      }),
    );

    const message = analysisFailureMessage(error);
    if (!refreshingReadyAnalysis) {
      await markAnalysisFailed(admin, workspaceId, mediaId, message);
      revalidatePath(`/content/${mediaId}`);
    }
    return { status: "error", message };
  }
}

async function persistScriptGeneratedByAnalysis({
  admin,
  workspaceId,
  mediaId,
  item,
  transcript,
  startedAt,
}: {
  admin: ReturnType<typeof createAdminClient>;
  workspaceId: string;
  mediaId: string;
  item: RankedContentItem;
  transcript: ReelAnalysis["transcript"];
  startedAt: string;
}) {
  try {
    const script = await generateReelScript(workspaceId, item, transcript);
    const { error } = await admin
      .from("content_scripts")
      .upsert(
        {
          workspace_id: workspaceId,
          instagram_media_id: mediaId,
          status: "ready",
          pipeline_version: script.pipelineVersion,
          result: script,
          failure_reason: null,
          can_retry: true,
          started_at: startedAt,
          completed_at: script.completedAt,
        },
        { onConflict: "instagram_media_id" },
      );

    if (error) {
      console.error(
        JSON.stringify({
          event: "content_analysis",
          error: "generated_script_save_failed",
          mediaId,
          code: error.code,
        }),
      );
    }
  } catch (error) {
    const message = scriptFailureMessage(error);
    console.error(
      JSON.stringify({
        event: "content_analysis",
        error: "generated_script_failed",
        mediaId,
        detail: error instanceof Error ? error.message : "unknown",
      }),
    );
    await admin
      .from("content_scripts")
      .upsert(
        {
          workspace_id: workspaceId,
          instagram_media_id: mediaId,
          status: "failed",
          pipeline_version: null,
          result: null,
          failure_reason: message,
          can_retry: true,
          started_at: startedAt,
          completed_at: null,
        },
        { onConflict: "instagram_media_id" },
      );
  }
}

type AuthorizedReelResult =
  | { ok: false; error: RequestAnalysisResult }
  | {
      ok: true;
      workspaceId: string;
      item: RankedContentItem;
      supabase: Awaited<ReturnType<typeof createClient>>;
    };

async function getAuthorizedReel(mediaId: string): Promise<AuthorizedReelResult> {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return { ok: false, error: { status: "error", message: "Tu sesión venció. Volvé a iniciar sesión." } };
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id")
    .limit(1)
    .maybeSingle();
  if (workspaceError || !workspace) {
    return { ok: false, error: { status: "error", message: "No encontramos tu workspace." } };
  }

  const library = await getInstagramContentLibrary(workspace.id);
  if (!library) {
    return { ok: false, error: { status: "error", message: "No encontramos tu cuenta de Instagram." } };
  }
  const sourceItem = library.items.find((item) => item.id === mediaId);
  if (!sourceItem || sourceItem.kind !== "reel") {
    return { ok: false, error: { status: "error", message: "No encontramos ese Reel en tu cuenta." } };
  }

  const item = buildCohort(library.items, "reel").find((candidate) => candidate.id === mediaId);
  if (!item) {
    return { ok: false, error: { status: "error", message: "No pudimos preparar ese Reel." } };
  }

  return { ok: true, workspaceId: workspace.id, item, supabase };
}

async function markScriptFailed(
  admin: ReturnType<typeof createAdminClient>,
  workspaceId: string,
  mediaId: string,
  message: string,
) {
  await admin
    .from("content_scripts")
    .update({
      status: "failed",
      result: null,
      failure_reason: message,
      can_retry: true,
      completed_at: null,
    })
    .eq("workspace_id", workspaceId)
    .eq("instagram_media_id", mediaId);
}

function scriptFailureMessage(error: unknown) {
  const code = error instanceof Error ? error.message : "unknown";
  if (code === "fresh_media_unavailable") {
    return "Instagram reconoce el Reel, pero todavía no está entregando el archivo del video.";
  }
  if (code === "empty_transcript") {
    return "No detectamos voz suficiente para preparar un guion.";
  }
  if (code === "video_too_large_for_inline_analysis") {
    return "Este Reel es demasiado pesado para procesarlo en este momento.";
  }
  const aiMessage = userMessageForAiFailure(error, "el guion");
  if (aiMessage) return aiMessage;
  return "No pudimos preparar el guion. Podés volver a intentarlo.";
}

async function markAnalysisFailed(
  admin: ReturnType<typeof createAdminClient>,
  workspaceId: string,
  mediaId: string,
  message: string,
) {
  const { error } = await admin
    .from("content_analyses")
    .update({
      status: "failed",
      result: null,
      failure_reason: message,
      can_retry: true,
      credits_spent: 0,
      completed_at: null,
    })
    .eq("workspace_id", workspaceId)
    .eq("instagram_media_id", mediaId);

  if (error) {
    console.error(
      JSON.stringify({
        event: "content_analysis",
        error: "failed_state_save_failed",
        mediaId,
      }),
    );
  }
}

function databaseError(event: string, mediaId: string): RequestAnalysisResult {
  console.error(JSON.stringify({ event: "content_analysis", error: event, mediaId }));
  return { status: "error", message: "No pudimos guardar el estado del análisis." };
}

function analysisFailureMessage(error: unknown) {
  const code = error instanceof Error ? error.message : "unknown";
  if (code === "fresh_media_unavailable") {
    return "Instagram reconoce el Reel, pero todavía no está entregando el archivo del video. Puede pasar después de desarchivarlo; sincronizá la cuenta y probá nuevamente más tarde.";
  }
  if (code === "video_too_large_for_inline_analysis") {
    return "Este Reel es demasiado pesado para el analizador actual.";
  }
  const aiMessage = userMessageForAiFailure(error, "el análisis");
  if (aiMessage) return aiMessage;
  return "No pudimos completar el análisis. No se descontó ningún crédito.";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
