import "server-only";

import { mapWithConcurrency } from "@/lib/async/map-with-concurrency";
import type { createAdminClient } from "@/lib/supabase/admin";
import { archivedVideoCutoff, isArchivedVideo, toArchiveFile } from "./story-archive-file";

export const STORY_ARCHIVE_BUCKET = "instagram-story-archive";

const MAX_FILE_BYTES = 50 * 1024 * 1024;

type AdminClient = ReturnType<typeof createAdminClient>;

export type StoryToArchive = {
  storedMediaId: string;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
};

/**
 * Guarda una copia propia de las Historias que todavía no la tienen.
 *
 * Corre mientras Meta las sigue entregando: vencidas las 24 h ya no hay archivo ni URL
 * nueva. Que falle una no frena la sincronización; se reintenta en la próxima corrida
 * mientras la Historia siga viva.
 */
export async function archiveStories(admin: AdminClient, socialAccountId: string, stories: StoryToArchive[]) {
  if (stories.length === 0) return;

  const { data: pending, error } = await admin
    .from("instagram_media")
    .select("id")
    .in("id", stories.map((story) => story.storedMediaId))
    .is("archived_media_path", null);
  if (error) {
    console.warn(JSON.stringify({ event: "story_archive", warning: "pending_read_failed" }));
    return;
  }

  const pendingIds = new Set((pending ?? []).map((row) => row.id as string));
  await mapWithConcurrency(
    stories.filter((story) => pendingIds.has(story.storedMediaId)),
    3,
    async (story) => {
      try {
        const folder = `${socialAccountId}/${story.storedMediaId}`;
        const [mediaPath, thumbnailPath] = await Promise.all([
          story.mediaUrl ? copyToArchive(admin, story.mediaUrl, `${folder}/media`) : null,
          story.thumbnailUrl ? copyToArchive(admin, story.thumbnailUrl, `${folder}/thumbnail`) : null,
        ]);
        if (!mediaPath) return;

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
