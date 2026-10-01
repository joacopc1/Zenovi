import { isAuthorizedCronRequest, runForActiveConnections } from "@/lib/cron/instagram-connections";
import { refreshLiveStories } from "@/lib/meta/story-refresh";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Cada hora: métricas y archivo de las Historias que siguen vivas. */
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  return runForActiveConnections(admin, (connectionId) => refreshLiveStories(admin, connectionId));
}
