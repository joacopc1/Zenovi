import "server-only";

import { STORY_ARCHIVE_BUCKET } from "@/lib/meta/story-archive";
import { createAdminClient } from "@/lib/supabase/admin";

/** Alcanza para una sesión de uso; la página vuelve a firmar en cada carga. */
const SIGNED_URL_SECONDS = 6 * 60 * 60;

/**
 * URLs firmadas para las copias propias de las Historias.
 *
 * Quien llama ya leyó esas rutas con el cliente del usuario, así que RLS garantizó que
 * son de su workspace: el cliente administrativo sólo firma, no decide qué se puede ver.
 */
export async function signArchivedStoryPaths(paths: readonly string[]) {
  const signed = new Map<string, string>();
  if (paths.length === 0) return signed;

  const { data, error } = await createAdminClient()
    .storage.from(STORY_ARCHIVE_BUCKET)
    .createSignedUrls([...paths], SIGNED_URL_SECONDS);
  if (error || !data) {
    console.warn(JSON.stringify({ event: "story_archive", warning: "sign_failed" }));
    return signed;
  }

  for (const entry of data) {
    if (entry.path && entry.signedUrl) signed.set(entry.path, entry.signedUrl);
  }
  return signed;
}
