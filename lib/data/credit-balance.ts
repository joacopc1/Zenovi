import "server-only";

import { getCreditAllowance } from "@/lib/credits/allowance";
import { creditBalance, creditPeriodStart, type CreditBalance } from "@/lib/credits/pricing";
import { createClient } from "@/lib/supabase/server";

/**
 * El saldo del mes de un workspace: lo que le toca según su Instagram, menos lo consumido
 * sumando cada operación con IA. Si el consumo no se puede leer, se muestra como lleno y no
 * como agotado: un fallo de lectura no debe bloquear a nadie.
 */
export async function getCreditBalance(workspaceId: string): Promise<CreditBalance> {
  const supabase = await createClient();
  const [allowance, { data, error }] = await Promise.all([
    getCreditAllowance(workspaceId),
    supabase.from("ai_usage_events").select("credits").eq("workspace_id", workspaceId).gte("created_at", creditPeriodStart()),
  ]);

  if (error) {
    console.warn(JSON.stringify({ event: "credits", warning: "balance_read_failed", code: error.code }));
    return creditBalance(0, new Date(), allowance.total, allowance.locked);
  }
  const used = (data ?? []).reduce((sum, row) => sum + Number(row.credits), 0);
  return creditBalance(Math.round(used * 100) / 100, new Date(), allowance.total, allowance.locked);
}
