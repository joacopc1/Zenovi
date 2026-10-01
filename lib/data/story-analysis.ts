import "server-only";

import { readStoryAnalysisState, type StoryAnalysisState } from "@/lib/content/story-analysis";
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
