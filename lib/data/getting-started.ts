import "server-only";

import { measureBrandDna } from "@/lib/brand/dna";
import { getBrandDna } from "@/lib/data/brand-dna";
import { buildChecklist } from "@/lib/onboarding/checklist";
import { createClient } from "@/lib/supabase/server";

/**
 * La lista de primeros pasos del Inicio, o null si la persona la cerró o ya hizo todo.
 * Todo se lee con su sesión (RLS): cuenta sólo lo de su workspace y sus chats.
 */
export async function getGettingStarted(workspaceId: string, userId: string, instagramConnected: boolean) {
  const supabase = await createClient();
  const exists = (query: PromiseLike<{ count: number | null }>) => Promise.resolve(query).then(({ count }) => (count ?? 0) > 0);

  const [onboarding, dna, analyzedReel, askedDirector, savedIdea] = await Promise.all([
    supabase.from("user_onboarding").select("checklist_dismissed_at").eq("user_id", userId).maybeSingle(),
    getBrandDna(workspaceId),
    exists(supabase.from("content_analyses").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("status", "ready")),
    exists(supabase.from("director_chats").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId)),
    exists(supabase.from("content_items").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId)),
  ]);

  if (onboarding.data?.checklist_dismissed_at) return null;
  const items = buildChecklist({
    instagramConnected,
    brandDnaPercent: measureBrandDna(dna).percent,
    analyzedReel,
    askedDirector,
    savedIdea,
  });
  return items.every((item) => item.done) ? null : items;
}
