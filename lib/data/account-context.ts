import "server-only";

import {
  isInstagramConnectionStatus,
  type InstagramAccountIdentity,
} from "@/lib/meta/connection-state";
import { createClient } from "@/lib/supabase/server";

export type AccountContext = {
  displayName: string;
  initials: string;
  workspace: {
    id: string;
    name: string;
  } | null;
  instagram: InstagramAccountIdentity | null;
};

export async function getAccountContext(): Promise<AccountContext | null> {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return null;
  }

  const [{ data: profile, error: profileError }, { data: workspace, error: workspaceError }] =
    await Promise.all([
      supabase.from("profiles").select("display_name").maybeSingle(),
      supabase.from("workspaces").select("id, name").limit(1).maybeSingle(),
    ]);

  if (profileError || workspaceError) {
    throw new Error("No pudimos cargar el contexto de la cuenta.");
  }

  const emailName = authData.user.email?.split("@")[0];
  const displayName = profile?.display_name || emailName || "Cuenta";
  let instagram: AccountContext["instagram"] = null;

  if (workspace) {
    const { data: connection, error: connectionError } = await supabase
      .from("social_connections")
      .select("id, status")
      .eq("workspace_id", workspace.id)
      .maybeSingle();

    if (connectionError) {
      throw new Error("No pudimos cargar el estado de Instagram.");
    }

    if (connection) {
      if (!isInstagramConnectionStatus(connection.status)) {
        throw new Error("El estado de la conexión de Instagram no es válido.");
      }

      const { data: socialAccount, error: socialAccountError } = await supabase
        .from("social_accounts")
        .select("username, profile_picture_url")
        .eq("connection_id", connection.id)
        .maybeSingle();

      if (socialAccountError) {
        throw new Error("No pudimos cargar la cuenta de Instagram.");
      }

      instagram = {
        status: connection.status,
        username: socialAccount?.username ?? null,
        profilePictureUrl: socialAccount?.profile_picture_url ?? null,
      };
    }
  }

  return {
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
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toLocaleUpperCase("es") ?? "")
    .join("") || "Z";
}
