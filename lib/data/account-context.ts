import "server-only";

import { cache } from "react";
import {
  isInstagramConnectionStatus,
  type InstagramAccountIdentity,
} from "@/lib/meta/connection-state";
import { createClient } from "@/lib/supabase/server";
import { readEmbeddedRow } from "./embedded-row";

export type AccountContext = {
  userId: string;
  avatarUrl: string | null;
  displayName: string;
  initials: string;
  workspace: {
    id: string;
    name: string;
  } | null;
  instagram: InstagramAccountIdentity | null;
};

/**
 * El contexto de la cuenta: quién es, qué marca tiene y en qué estado está su Instagram.
 *
 * Va envuelto en `cache` porque lo piden el layout y cada página: sin eso, una sola
 * navegación pagaba dos veces los mismos viajes a la base, y la base está a unos 150 ms.
 * Dentro de un mismo render se resuelve una vez y se reparte.
 */
export const getAccountContext = cache(async (): Promise<AccountContext | null> => {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return null;
  }

  const [{ data: profile, error: profileError }, { data: workspace, error: workspaceError }] =
    await Promise.all([
      supabase.from("profiles").select("display_name, avatar_url").maybeSingle(),
      supabase.from("workspaces").select("id, name").limit(1).maybeSingle(),
    ]);

  if (profileError || workspaceError) {
    throw new Error("No pudimos cargar el contexto de la cuenta.");
  }

  const emailName = authData.user.email?.split("@")[0];
  const displayName = profile?.display_name || emailName || "Cuenta";
  let instagram: AccountContext["instagram"] = null;

  if (workspace) {
    // La cuenta viene incrustada en la misma consulta que la conexión: eran dos viajes
    // seguidos a la base para dos filas que siempre se leen juntas.
    const { data: connection, error: connectionError } = await supabase
      .from("social_connections")
      .select("status, social_accounts(username, profile_picture_url)")
      .eq("workspace_id", workspace.id)
      .maybeSingle();

    if (connectionError) {
      throw new Error("No pudimos cargar el estado de Instagram.");
    }

    if (connection) {
      if (!isInstagramConnectionStatus(connection.status)) {
        throw new Error("El estado de la conexión de Instagram no es válido.");
      }

      const account = readEmbeddedRow<{ username: string | null; profile_picture_url: string | null }>(
        connection.social_accounts,
      );

      instagram = {
        status: connection.status,
        username: account?.username ?? null,
        profilePictureUrl: account?.profile_picture_url ?? null,
      };
    }
  }

  return {
    userId: authData.user.id,
    avatarUrl: profile?.avatar_url ?? getMetadataAvatar(authData.user.user_metadata),
    displayName,
    initials: getInitials(displayName),
    workspace: workspace
      ? {
          id: workspace.id,
          name: workspace.name,
        }
      : null,
    instagram,
  };
});

function getMetadataAvatar(metadata: Record<string, unknown>) {
  const value = metadata.avatar_url ?? metadata.picture;
  return typeof value === "string" && value.trim() ? value : null;
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toLocaleUpperCase("es") ?? "")
    .join("") || "Z";
}
