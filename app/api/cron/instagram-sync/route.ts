import { isAuthorizedCronRequest, runForActiveConnections } from "@/lib/cron/instagram-connections";
import { expireArchivedStoryVideos } from "@/lib/meta/story-archive";
import { syncStoredInstagramConnection } from "@/lib/meta/stored-sync";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Una vez por día: sincronización completa y limpieza de los videos de Historias con más de 30 días. */
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const expired = await expireArchivedStoryVideos(admin);
  if (!expired.ok) {
    console.warn(JSON.stringify({ event: "story_archive", warning: expired.code }));
  }

  return runForActiveConnections(admin, (connectionId) => syncStoredInstagramConnection(admin, connectionId));
}
