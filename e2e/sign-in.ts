import type { BrowserContext } from "@playwright/test";
import { createServerClient } from "@supabase/ssr";
import { env, type TestAccount } from "./test-account";

/**
 * Entra sin pasar por el formulario: el login tiene CAPTCHA, que un navegador automático
 * no pasa (está hecho para eso). La sesión la arma la misma librería que usa la app, así
 * las cookies tienen exactamente su formato.
 */
export async function signIn(context: BrowserContext, account: TestAccount, baseURL: string) {
  const cookies: Array<{ name: string; value: string }> = [];
  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => [],
      setAll: (values) => {
        cookies.push(...values.map(({ name, value }) => ({ name, value })));
      },
    },
  });
  const { error } = await supabase.auth.signInWithPassword({ email: account.email, password: account.password });
  if (error) throw new Error(`La cuenta de prueba no pudo entrar: ${error.message}`);
  await context.addCookies(cookies.map((cookie) => ({ ...cookie, url: baseURL })));
}
