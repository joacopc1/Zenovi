"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LAST_ACCOUNT_COOKIE, LAST_ACCOUNT_MAX_AGE_SECONDS, readLastAccount } from "@/lib/auth/last-account";
import { getAccountContext } from "@/lib/data/account-context";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  // Antes de cerrar la sesión se anota con qué cuenta se entraba, para saludarla en el login.
  const username = readLastAccount((await getAccountContext())?.instagram?.username ?? undefined);
  if (username) {
    (await cookies()).set(LAST_ACCOUNT_COOKIE, username, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: LAST_ACCOUNT_MAX_AGE_SECONDS,
      path: "/",
    });
  }
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
