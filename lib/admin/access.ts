import "server-only";

import { parseAdminEmails } from "@/lib/admin/usage-report";
import { createClient } from "@/lib/supabase/server";

/**
 * Si la sesión es de alguien del equipo de Zenovi. La lista sale de `ZENOVI_ADMIN_EMAILS`,
 * que sólo existe en el servidor; sin la variable no entra nadie.
 */
export async function isZenoviAdmin() {
  const admins = parseAdminEmails(process.env.ZENOVI_ADMIN_EMAILS);
  if (admins.size === 0) return false;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email?.toLowerCase();
  return Boolean(email && data.user?.email_confirmed_at && admins.has(email));
}
