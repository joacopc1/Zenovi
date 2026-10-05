import "server-only";

import { getMetaTokenEncryptionKey } from "@/lib/meta/config";
import type { createAdminClient } from "@/lib/supabase/admin";
import { emailTrialFingerprint, instagramTrialFingerprint, normalizeTrialEmail, trialFingerprintKey } from "./trial-fingerprint";

type Admin = ReturnType<typeof createAdminClient>;
type ClaimTable = { table: "instagram_trial_claims"; column: "account_fingerprint" } | { table: "email_trial_claims"; column: "email_fingerprint" };

export type TrialDecision = { granted: boolean; reason: "trial_used" | "email_used" | null };

const INSTAGRAM: ClaimTable = { table: "instagram_trial_claims", column: "account_fingerprint" };
const EMAIL: ClaimTable = { table: "email_trial_claims", column: "email_fingerprint" };

/**
 * Anota una huella y devuelve el primer workspace que la usó, o null si no se pudo anotar.
 * Se lee primero: casi siempre la huella ya está y no hace falta escribir. Si no está, el
 * alta devuelve la fila escrita; no se vuelve a leer, porque dentro de una página Next
 * recuerda las lecturas iguales y devolvería el "no está" de la primera.
 */
async function claim(admin: Admin, { table, column }: ClaimTable, fingerprint: string, workspaceId: string) {
  const existing = await admin.from(table).select("first_workspace_id").eq(column, fingerprint).maybeSingle();
  if (existing.data) return { firstWorkspaceId: existing.data.first_workspace_id as string | null };
  if (existing.error) return claimFailed(table, existing.error.code);

  const inserted = await admin.from(table).insert({ [column]: fingerprint, first_workspace_id: workspaceId }).select("first_workspace_id").single();
  if (inserted.data) return { firstWorkspaceId: inserted.data.first_workspace_id as string | null };
  // Otra pestaña la anotó entre la lectura y el alta: se lee la que quedó.
  if (inserted.error?.code === "23505") {
    const winner = await admin.from(table).select("first_workspace_id, claimed_at").eq(column, fingerprint).maybeSingle();
    if (winner.data) return { firstWorkspaceId: winner.data.first_workspace_id as string | null };
  }
  return claimFailed(table, inserted.error?.code);
}

function claimFailed(table: string, code: string | undefined) {
  console.error(JSON.stringify({ event: "trial_claim", error: "claim_failed", table, code: code ?? null }));
  return null;
}

function fingerprintKey() {
  return trialFingerprintKey(getMetaTokenEncryptionKey());
}

/**
 * Anota que esta cuenta de Instagram ya entró a Zenovi y dice si la prueba gratis le
 * corresponde a este workspace: sí, si fue el primero en conectarla. Reconectarla en otra
 * cuenta de Zenovi no da otra prueba. Si la anotación falla, no se corta la conexión.
 */
export async function claimInstagramTrial(admin: Admin, workspaceId: string, providerAccountId: string) {
  const claimed = await claim(admin, INSTAGRAM, instagramTrialFingerprint(providerAccountId, fingerprintKey()), workspaceId);
  if (claimed && claimed.firstWorkspaceId !== workspaceId) {
    console.warn(JSON.stringify({ event: "trial_claim", warning: "instagram_already_had_trial" }));
  }
  return { trialAvailable: !claimed || claimed.firstWorkspaceId === workspaceId };
}

/**
 * Si este workspace recibe la prueba con el Instagram que tiene conectado: hace falta que
 * sea el primero en conectar ese Instagram y que el mail de quien lo creó no la haya usado
 * con otro (alias de Gmail o varios workspaces de la misma persona cuentan como uno). La
 * decisión se guarda por workspace e Instagram, así el saldo de cada página lee una fila.
 * Si algo falla al anotar, se da la prueba: un error nuestro no deja a nadie sin IA.
 */
export async function decideWorkspaceTrial(admin: Admin, workspaceId: string, providerAccountId: string): Promise<TrialDecision> {
  const key = fingerprintKey();
  const accountFingerprint = instagramTrialFingerprint(providerAccountId, key);

  const stored = await admin
    .from("workspace_trial_grants")
    .select("account_fingerprint, granted, reason")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (stored.data && stored.data.account_fingerprint === accountFingerprint) {
    return { granted: stored.data.granted, reason: stored.data.reason };
  }

  const decision = await decideFresh(admin, workspaceId, accountFingerprint, key);
  if (!stored.error) {
    const { error } = await admin
      .from("workspace_trial_grants")
      .upsert({ workspace_id: workspaceId, account_fingerprint: accountFingerprint, granted: decision.granted, reason: decision.reason, decided_at: new Date().toISOString() }, { onConflict: "workspace_id" });
    if (error) console.error(JSON.stringify({ event: "trial_claim", error: "grant_store_failed", code: error.code }));
  }
  return decision;
}

async function decideFresh(admin: Admin, workspaceId: string, accountFingerprint: string, key: Buffer): Promise<TrialDecision> {
  const instagram = await claim(admin, INSTAGRAM, accountFingerprint, workspaceId);
  if (instagram && instagram.firstWorkspaceId !== workspaceId) return { granted: false, reason: "trial_used" };

  // Recién con un Instagram nuevo se anota el mail: un intento rechazado no lo gasta.
  const email = await ownerEmail(admin, workspaceId);
  if (!email) return { granted: true, reason: null };
  const byEmail = await claim(admin, EMAIL, emailTrialFingerprint(email, key), workspaceId);
  if (byEmail && byEmail.firstWorkspaceId !== workspaceId) return { granted: false, reason: "email_used" };
  return { granted: true, reason: null };
}

/** El mail de quien creó el workspace, normalizado. */
async function ownerEmail(admin: Admin, workspaceId: string) {
  const { data: workspace } = await admin.from("workspaces").select("created_by").eq("id", workspaceId).maybeSingle();
  if (!workspace?.created_by) return null;
  const { data } = await admin.auth.admin.getUserById(workspace.created_by);
  return data.user?.email ? normalizeTrialEmail(data.user.email) : null;
}
