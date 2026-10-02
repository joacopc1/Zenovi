import "server-only";

import {
  parseStorySequenceAnalysis,
  readStoryAnalysisState,
  type StoryAnalysisState,
  type StorySequenceAnalysis,
} from "@/lib/content/story-analysis";
import { createClient } from "@/lib/supabase/server";

export async function getStorySequenceAnalysis(anchorMediaId: string): Promise<StoryAnalysisState> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_analyses")
    .select("status, result, failure_reason, can_retry, started_at")
    .eq("instagram_media_id", anchorMediaId)
    .maybeSingle();

  if (error) {
    console.warn(JSON.stringify({ event: "story_analysis", warning: "read_failed", code: error.code }));
    return { status: "failed", reason: "No pudimos leer el análisis de esta secuencia.", canRetry: true };
  }

  return readStoryAnalysisState(
    data
      ? {
          status: data.status,
          result: data.result,
          failureReason: data.failure_reason,
          canRetry: data.can_retry,
          startedAt: data.started_at,
        }
      : null,
  );
}

/** Los análisis listos de varias secuencias a la vez, por la Historia que abre cada una. */
export async function getReadyStoryAnalyses(anchorMediaIds: readonly string[]): Promise<Map<string, StorySequenceAnalysis>> {
  if (anchorMediaIds.length === 0) return new Map();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_analyses")
    .select("instagram_media_id, result")
    .in("instagram_media_id", [...anchorMediaIds])
    .eq("status", "ready");

  if (error) {
    console.warn(JSON.stringify({ event: "story_analysis", warning: "list_failed", code: error.code }));
    return new Map();
  }

  const analyses = new Map<string, StorySequenceAnalysis>();
  for (const row of data ?? []) {
    const analysis = parseStorySequenceAnalysis(row.result);
    if (analysis) analyses.set(row.instagram_media_id, analysis);
  }
  return analyses;
}
