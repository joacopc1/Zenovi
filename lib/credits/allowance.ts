import "server-only";

import { cache } from "react";
import { decideWorkspaceTrial } from "@/lib/billing/trial-claims";
import { BETA_MONTHLY_CREDITS, type CreditLock } from "@/lib/credits/pricing";
import { readEmbeddedRow } from "@/lib/data/embedded-row";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type CreditAllowance = { total: number; locked: CreditLock | null };

/**
 * Cuántos créditos le tocan al workspace este mes. Los da la cuenta de Instagram conectada,
 * una sola vez por Instagram y por mail: diez cuentas de Zenovi sin Instagram, con el mismo
 * Instagram o con alias del mismo Gmail no suman diez veces los créditos. Las conexiones
 * previas a la huella se anotan acá la primera vez que se consulta su saldo.
 */
export const getCreditAllowance = cache(async (workspaceId: string): Promise<CreditAllowance> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("social_connections")
    .select("social_accounts(provider_account_id)")
    .eq("workspace_id", workspaceId)
    .eq("provider", "instagram")
    .maybeSingle();
  if (error) {
    // Un fallo de lectura no deja sin IA a quien sí tiene Instagram; lo frena el próximo intento.
    console.warn(JSON.stringify({ event: "credits", warning: "allowance_read_failed", code: error.code }));
    return { total: BETA_MONTHLY_CREDITS, locked: null };
  }

  const account = readEmbeddedRow<{ provider_account_id: string | null }>(data?.social_accounts);
  if (!account?.provider_account_id) return { total: 0, locked: "no_instagram" };

  const decision = await decideWorkspaceTrial(createAdminClient(), workspaceId, account.provider_account_id);
  return decision.granted ? { total: BETA_MONTHLY_CREDITS, locked: null } : { total: 0, locked: decision.reason ?? "trial_used" };
});
