import "server-only";

import { mapWithConcurrency } from "@/lib/async/map-with-concurrency";
import type { InstagramMedia } from "@/lib/meta/api";
import type { createAdminClient } from "@/lib/supabase/admin";
import { ARCHIVED_VIDEOS_PER_ACCOUNT, archivedVideoCutoff, isArchivedVideo, toArchiveFile } from "./story-archive-file";

export const STORY_ARCHIVE_BUCKET = "instagram-story-archive";

const MAX_FILE_BYTES = 50 * 1024 * 1024;

type AdminClient = ReturnType<typeof createAdminClient>;

export type StoryToArchive = {
  storedMediaId: string;
  isVideo: boolean;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
};

/** Las Historias de una corrida, con su id guardado, listas para archivar. */
export function storiesToArchive(
  media: readonly InstagramMedia[],
  storedIdByProviderId: ReadonlyMap<string, string>,
): StoryToArchive[] {
  return media.flatMap((item) => {
    const storedMediaId = storedIdByProviderId.get(item.id);
    return item.mediaProductType === "STORY" && storedMediaId
      ? [{ storedMediaId, isVideo: item.mediaType === "VIDEO", mediaUrl: item.mediaUrl, thumbnailUrl: item.thumbnailUrl }]
      : [];
  });
}

/**
 * Guarda una copia propia de las Historias que todavía no la tienen.
 *
 * Corre mientras Meta las sigue entregando: vencidas las 24 h ya no hay archivo ni URL
 * nueva. Que falle una no frena la sincronización; se reintenta en la próxima corrida
 * mientras la Historia siga viva.
 */
export async function archiveStories(admin: AdminClient, socialAccountId: string, stories: StoryToArchive[]) {
  if (stories.length === 0) return;

  const [{ data: pending, error }, { count: archivedVideos, error: countError }] = await Promise.all([
    admin
      .from("instagram_media")
      .select("id")
      .in("id", stories.map((story) => story.storedMediaId))
      // Una Historia ya guardada tiene al menos una de las dos rutas (un video pasado del tope, sólo la portada).
      .is("archived_media_path", null)
      .is("archived_thumbnail_path", null),
    admin
      .from("instagram_media")
      .select("id", { count: "exact", head: true })
      .eq("social_account_id", socialAccountId)
      .or("archived_media_path.like.*.mp4,archived_media_path.like.*.mov"),
  ]);
  if (error || countError) {
    console.warn(JSON.stringify({ event: "story_archive", warning: "pending_read_failed" }));
    return;
  }

  const pendingIds = new Set((pending ?? []).map((row) => row.id as string));
  let videoBudget = ARCHIVED_VIDEOS_PER_ACCOUNT - (archivedVideos ?? 0);
  await mapWithConcurrency(
    stories.filter((story) => pendingIds.has(story.storedMediaId)),
    3,
    async (story) => {
      // Se descuenta antes de esperar nada: las tres descargas en paralelo no pasan el tope.
      const keepMedia = !story.isVideo || videoBudget-- > 0;
      try {
        const folder = `${socialAccountId}/${story.storedMediaId}`;
        const [mediaPath, thumbnailPath] = await Promise.all([
          keepMedia && story.mediaUrl ? copyToArchive(admin, story.mediaUrl, `${folder}/media`) : null,
          story.thumbnailUrl ? copyToArchive(admin, story.thumbnailUrl, `${folder}/thumbnail`) : null,
        ]);
        if (!mediaPath && !thumbnailPath) return;

        const { error: updateError } = await admin
          .from("instagram_media")
          .update({ archived_media_path: mediaPath, archived_thumbnail_path: thumbnailPath })
          .eq("id", story.storedMediaId)
          .eq("social_account_id", socialAccountId);
        if (updateError) throw new Error("archive_path_update_failed");
      } catch (archiveError) {
        console.warn(JSON.stringify({
          event: "story_archive",
          warning: "story_not_archived",
          mediaId: story.storedMediaId,
          detail: archiveError instanceof Error ? archiveError.message : "unknown",
        }));
      }
    },
  );
}

async function copyToArchive(admin: AdminClient, url: string, basePath: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`archive_download_http_${response.status}`);

  const declaredBytes = Number(response.headers.get("content-length"));
  if (declaredBytes > MAX_FILE_BYTES) throw new Error("archive_file_too_large");
  const downloaded = new Uint8Array(await response.arrayBuffer());
  if (downloaded.byteLength > MAX_FILE_BYTES) throw new Error("archive_file_too_large");

  const file = await toArchiveFile(
    response.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase() ?? "",
    downloaded,
  );
  const path = `${basePath}.${file.extension}`;
  const { error } = await admin.storage
    .from(STORY_ARCHIVE_BUCKET)
    .upload(path, file.bytes, { contentType: file.contentType, upsert: true });
  if (error) throw new Error("archive_upload_failed");
  return path;
}

/**
 * Borra los videos guardados de Historias con más de 30 días y deja su portada: la
 * biblioteca sigue mostrando la miniatura y el análisis trabaja sobre la imagen.
 */
export async function expireArchivedStoryVideos(admin: AdminClient, now = new Date()) {
  const { data, error } = await admin
    .from("instagram_media")
    .select("id, archived_media_path")
    .not("archived_media_path", "is", null)
    .lt("posted_at", archivedVideoCutoff(now).toISOString())
    .limit(1000);
  if (error) return { ok: false as const, code: "expired_videos_read_failed" };

  const expired = (data ?? []).filter((row) => isArchivedVideo(row.archived_media_path as string));
  if (expired.length === 0) return { ok: true as const, removed: 0 };

  const { error: removeError } = await admin.storage
    .from(STORY_ARCHIVE_BUCKET)
    .remove(expired.map((row) => row.archived_media_path as string));
  if (removeError) return { ok: false as const, code: "expired_videos_remove_failed" };

  // Sin el archivo propio, la URL de Meta tampoco sirve: queda sólo la portada.
  const { error: updateError } = await admin
    .from("instagram_media")
    .update({ archived_media_path: null, media_url: null })
    .in("id", expired.map((row) => row.id as string));
  if (updateError) return { ok: false as const, code: "expired_videos_update_failed" };

  return { ok: true as const, removed: expired.length };
}
