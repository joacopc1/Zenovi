import "server-only";

import {
  readMediaViewEvolution,
  type MediaViewEvolution,
  type MediaViewSnapshot,
} from "@/lib/content/media-view-evolution";
import { createClient } from "@/lib/supabase/server";

type SnapshotRow = {
  observed_on: string;
  value: number | string;
};

export async function getMediaViewEvolution(
  mediaId: string,
): Promise<MediaViewEvolution> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("instagram_media_insight_snapshots")
    .select("observed_on, value")
    .eq("instagram_media_id", mediaId)
    .eq("metric", "views")
    .order("observed_on", { ascending: false })
    .limit(90);

  if (error) throw new Error("No pudimos cargar la evolución de este contenido.");

  const snapshots = (data ?? []).flatMap((row: SnapshotRow) => {
    const value = Number(row.value);
    return Number.isFinite(value)
      ? [{ observedOn: row.observed_on, value } satisfies MediaViewSnapshot]
      : [];
  });

  return readMediaViewEvolution(snapshots);
}
