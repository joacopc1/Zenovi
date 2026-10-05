"use server";

import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Marca como leídas notificaciones de la persona. RLS no deja marcar las que no puede ver. */
export async function markNotificationsRead(ids: string[]) {
  const valid = [...new Set(ids)].filter((id) => UUID.test(id)).slice(0, 50);
  if (valid.length === 0) return;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  const { error } = await supabase
    .from("notification_reads")
    .upsert(valid.map((id) => ({ user_id: data.user!.id, notification_id: id })), { onConflict: "user_id,notification_id", ignoreDuplicates: true });
  if (error) console.warn(JSON.stringify({ event: "notifications", warning: "mark_read_failed", code: error.code }));
}
