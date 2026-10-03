"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Cerrar la lista de primeros pasos: no vuelve a aparecer para esta persona. */
export async function dismissGettingStarted() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  await supabase
    .from("user_onboarding")
    .upsert({ user_id: auth.user.id, checklist_dismissed_at: new Date().toISOString() }, { onConflict: "user_id" });
  revalidatePath("/");
}
