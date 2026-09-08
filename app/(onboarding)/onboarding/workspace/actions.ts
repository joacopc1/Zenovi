"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CreateWorkspaceState = {
  error?: string;
};

export async function createWorkspace(
  _previousState: CreateWorkspaceState,
  formData: FormData,
): Promise<CreateWorkspaceState> {
  const name = String(formData.get("name") ?? "").trim();

  if (name.length < 1 || name.length > 80) {
    return { error: "Ingresá un nombre de hasta 80 caracteres." };
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return { error: "Tu sesión venció. Volvé a iniciar sesión." };
  }

  const { error } = await supabase.from("workspaces").insert({
    name,
    created_by: authData.user.id,
  });

  if (error) {
    return { error: "No pudimos crear el workspace. Intentá nuevamente." };
  }

  redirect("/onboarding/instagram");
}
