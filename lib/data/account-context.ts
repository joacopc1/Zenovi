import "server-only";

import { createClient } from "@/lib/supabase/server";

export type AccountContext = {
  displayName: string;
  initials: string;
  workspace: {
    id: string;
    name: string;
  } | null;
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

  return {
    displayName,
    initials: getInitials(displayName),
    workspace: workspace
      ? {
          id: workspace.id,
          name: workspace.name,
        }
      : null,
  };
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toLocaleUpperCase("es") ?? "")
    .join("") || "Z";
}
