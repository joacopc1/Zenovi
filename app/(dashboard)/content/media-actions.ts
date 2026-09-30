"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const MAX_MEDIA_DIMENSION = 10_000;

/**
 * Guarda la proporción que el navegador leyó del archivo real.
 *
 * El id y las dimensiones llegan desde el cliente, por eso se validan y la pieza se
 * vuelve a leer con RLS antes de usar el cliente administrativo para persistirlas.
 */
export async function persistMediaDimensions(
  mediaId: string,
  width: number,
  height: number,
): Promise<void> {
  if (!isUuid(mediaId) || !isDimension(width) || !isDimension(height)) return;

  const mediaWidth = Math.round(width);
  const mediaHeight = Math.round(height);
  const supabase = await createClient();
  const { data: media, error } = await supabase
    .from("instagram_media")
    .select("id, media_width, media_height")
    .eq("id", mediaId)
    .maybeSingle();

  if (error || !media) return;
  if (media.media_width === mediaWidth && media.media_height === mediaHeight) return;

  const { error: updateError } = await createAdminClient()
    .from("instagram_media")
    .update({ media_width: mediaWidth, media_height: mediaHeight })
    .eq("id", media.id);

  if (updateError) {
    console.error(JSON.stringify({ event: "media_dimensions", error: "save_failed", mediaId }));
    return;
  }

  revalidatePath("/content");
  revalidatePath(`/content/${mediaId}`);
}

function isDimension(value: number) {
  return Number.isFinite(value) && value >= 1 && value <= MAX_MEDIA_DIMENSION;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
