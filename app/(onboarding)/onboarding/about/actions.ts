"use server";

import { redirect } from "next/navigation";
import { isRoleOption, isSourceOption, nextOnboardingPath } from "@/lib/onboarding/steps";
import { createClient } from "@/lib/supabase/server";

/**
 * Guarda a qué se dedica y cómo conoció Zenovi. Saltear también se anota (sin respuestas),
 * así no se vuelve a preguntar. Sólo se aceptan las opciones de la lista.
 */
export async function saveOnboardingAbout(role: string | null, source: string | null) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  await supabase.from("user_onboarding").upsert(
    {
      user_id: auth.user.id,
      role: isRoleOption(role) ? role : null,
      source: isSourceOption(source) ? source : null,
      answered_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  redirect(nextOnboardingPath("about"));
}
