"use server";

import { getAccountContext } from "@/lib/data/account-context";
import { takeRateLimit } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";

export type FeedbackResult = { ok?: true; error?: string };

/** Guarda un mensaje de feedback a nombre de quien lo manda, con la pantalla de donde vino. */
export async function sendFeedback(message: string, page: string): Promise<FeedbackResult> {
  const clean = message.trim();
  if (clean.length < 3) return { error: "Contanos un poco más." };
  if (clean.length > 2000) return { error: "El mensaje es muy largo (hasta 2.000 caracteres)." };
  const account = await getAccountContext();
  if (!account) return { error: "Tu sesión venció. Volvé a iniciar sesión." };
  if (!(await takeRateLimit("feedback", account.userId))) return { error: "Mandaste varios seguidos. Probá en un rato." };

  const supabase = await createClient();
  const { error } = await supabase.from("feedback").insert({
    user_id: account.userId,
    workspace_id: account.workspace?.id ?? null,
    message: clean,
    page: page.startsWith("/") ? page.slice(0, 200) : null,
  });
  if (error) return { error: "No pudimos mandarlo. Probá de nuevo." };
  return { ok: true };
}
