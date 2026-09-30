import "server-only";

import { readScriptState, type ScriptState } from "@/lib/content/script";
import { createClient } from "@/lib/supabase/server";

type ScriptRow = {
  status: string;
  result: unknown;
  failure_reason: string | null;
  can_retry: boolean;
  started_at: string | null;
};

export async function getContentScript(mediaId: string): Promise<ScriptState> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_scripts")
    .select("status, result, failure_reason, can_retry, started_at")
    .eq("instagram_media_id", mediaId)
    .maybeSingle();

  if (error) {
    console.warn(
      JSON.stringify({ event: "content_script", warning: "read_failed", code: error.code }),
    );
    return { status: "not_requested" };
  }

  const row = data as ScriptRow | null;
  return readScriptState(
    row === null
      ? null
      : {
          status: row.status,
          result: row.result,
          failureReason: row.failure_reason,
          canRetry: row.can_retry,
          startedAt: row.started_at,
        },
  );
}
