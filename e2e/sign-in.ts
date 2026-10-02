import type { BrowserContext } from "@playwright/test";
import { createServerClient } from "@supabase/ssr";
import { adminFetch, env, type TestAccount } from "./test-account";

/**
 * Entra sin pasar por el formulario: el login tiene CAPTCHA, que un navegador automático
 * no pasa (está hecho para eso), y Supabase lo exige también con contraseña. El servidor
 * genera un enlace de acceso con la clave de servicio y la misma librería que usa la app
 * lo canjea por la sesión, así las cookies tienen exactamente su formato.
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
  const link = await adminFetch("/auth/v1/admin/generate_link", {
    method: "POST",
    body: JSON.stringify({ type: "magiclink", email: account.email }),
  }).then((response) => response.json());
  const { error } = await supabase.auth.verifyOtp({ token_hash: link.hashed_token ?? link.properties?.hashed_token, type: "magiclink" });
  if (error) throw new Error(`La cuenta de prueba no pudo entrar: ${error.message}`);
  await context.addCookies(cookies.map((cookie) => ({ ...cookie, url: baseURL })));
}
