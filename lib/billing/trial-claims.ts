import "server-only";

import { getMetaTokenEncryptionKey } from "@/lib/meta/config";
import type { createAdminClient } from "@/lib/supabase/admin";
import { instagramTrialFingerprint, trialFingerprintKey } from "./trial-fingerprint";

/**
 * Anota que esta cuenta de Instagram ya entró a Zenovi y dice si la prueba gratis le
 * corresponde a este workspace: sí, si fue el primero en conectarla. Reconectarla en otra
 * cuenta de Zenovi no da otra prueba. Si la anotación falla, no se corta la conexión.
 */
export async function claimInstagramTrial(
  admin: ReturnType<typeof createAdminClient>,
  workspaceId: string,
  providerAccountId: string,
) {
  const fingerprint = instagramTrialFingerprint(providerAccountId, trialFingerprintKey(getMetaTokenEncryptionKey()));
  await admin
    .from("instagram_trial_claims")
    .upsert({ account_fingerprint: fingerprint, first_workspace_id: workspaceId }, { onConflict: "account_fingerprint", ignoreDuplicates: true });
  const { data, error } = await admin
    .from("instagram_trial_claims")
    .select("first_workspace_id")
    .eq("account_fingerprint", fingerprint)
    .maybeSingle();

  if (error || !data) {
    console.error(JSON.stringify({ event: "trial_claim", error: "claim_failed", code: error?.code }));
    return { trialAvailable: true };
  }
  if (data.first_workspace_id !== workspaceId) {
    console.warn(JSON.stringify({ event: "trial_claim", warning: "instagram_already_had_trial" }));
  }
  return { trialAvailable: data.first_workspace_id === workspaceId };
}
