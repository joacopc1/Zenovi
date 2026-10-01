import "server-only";

import { getInstagramStories } from "@/lib/meta/api";
import { archiveStories, storiesToArchive } from "@/lib/meta/story-archive";
import { planStoryRefresh } from "@/lib/meta/story-archive-file";
import { loadConnectionAccess } from "@/lib/meta/stored-sync";
import { fetchMediaInsightRows, saveMediaInsights, toMediaRow } from "@/lib/meta/sync";
import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Refresca las Historias que siguen vivas: métricas y copia del archivo.
 *
 * Meta entrega las métricas de una Historia sólo durante sus 24 h y, con Instagram Login,
 * no avisa cuando vence. Corriendo cada hora, la última lectura queda dentro de la hora
 * previa al vencimiento: es prácticamente el número final.
 */
export async function refreshLiveStories(admin: AdminClient, connectionId: string) {
  const connection = await loadConnectionAccess(admin, connectionId);
  if (!connection.ok) return connection;

  const stories = await getInstagramStories(connection.accessToken);
  if (!stories.ok) return { ok: false as const, code: stories.code };
  if (stories.data.length === 0) return { ok: true as const, storyCount: 0 };

  const syncedAt = new Date().toISOString();
  const { data: stored, error } = await admin
    .from("instagram_media")
    .upsert(stories.data.map((story) => toMediaRow(story, connection.socialAccountId, syncedAt)), {
      onConflict: "social_account_id,provider_media_id",
    })
    .select("id, provider_media_id");
  if (error || !stored) return { ok: false as const, code: "story_persistence_failed" };

  const storedIdByProviderId = new Map(stored.map((row) => [row.provider_media_id as string, row.id as string]));
  const [insightRows] = await Promise.all([
    fetchMediaInsightRows(planStoryRefresh(stories.data), storedIdByProviderId, connection.accessToken, syncedAt),
    archiveStories(admin, connection.socialAccountId, storiesToArchive(stories.data, storedIdByProviderId)),
  ]);

  if (!(await saveMediaInsights(admin, insightRows, syncedAt))) {
    return { ok: false as const, code: "story_insights_persistence_failed" };
  }
  return { ok: true as const, storyCount: stories.data.length };
}
