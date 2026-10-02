import "server-only";

import { parseReelScript, readScriptState, type ReelScript, type ScriptState } from "@/lib/content/script";
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

/**
 * Los guiones listos de todo el workspace, para que el Director encuentre un Reel por lo
 * que se dice en él y no sólo por su caption. Se leen con la sesión (RLS).
 */
export async function getReadyScripts(workspaceId: string): Promise<Map<string, ReelScript>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_scripts")
    .select("instagram_media_id, result")
    .eq("workspace_id", workspaceId)
    .eq("status", "ready");

  if (error) {
    console.warn(JSON.stringify({ event: "content_script", warning: "list_failed", code: error.code }));
    return new Map();
  }

  const scripts = new Map<string, ReelScript>();
  for (const row of data ?? []) {
    const script = parseReelScript(row.result);
    if (script) scripts.set(row.instagram_media_id, script);
  }
  return scripts;
}
