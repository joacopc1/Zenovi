import "server-only";

import { BROADCAST_DAYS, NOTIFICATION_KINDS, NOTIFICATIONS_SHOWN, safeNotificationHref, type AppNotification, type NotificationKind } from "@/lib/notifications/model";
import { createClient } from "@/lib/supabase/server";

/**
 * Las notificaciones de la persona: las suyas y las novedades para todos de los últimos
 * 60 días, con cuáles ya leyó. RLS decide qué ve cada uno. Si falla, el menú queda vacío.
 */
export async function getNotifications(userId: string): Promise<AppNotification[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - BROADCAST_DAYS * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, kind, title, body, href, created_at, user_id")
    .or(`user_id.eq.${userId},and(user_id.is.null,created_at.gte.${since})`)
    .order("created_at", { ascending: false })
    .limit(NOTIFICATIONS_SHOWN);
  if (error || !data) {
    if (error) console.warn(JSON.stringify({ event: "notifications", warning: "read_failed", code: error.code }));
    return [];
  }

  const ids = data.map((row) => row.id);
  const { data: reads } = ids.length
    ? await supabase.from("notification_reads").select("notification_id").eq("user_id", userId).in("notification_id", ids)
    : { data: [] };
  const read = new Set((reads ?? []).map((row) => row.notification_id));

  return data
    .filter((row) => (NOTIFICATION_KINDS as readonly string[]).includes(row.kind))
    .map((row) => ({
      id: row.id,
      kind: row.kind as NotificationKind,
      title: row.title,
      body: row.body,
      href: safeNotificationHref(row.href),
      createdAt: row.created_at,
      unread: !read.has(row.id),
    }));
}
