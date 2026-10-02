"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useRef, useState } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || null;

/**
 * El CAPTCHA de Cloudflare (Turnstile) para entrar, registrarse y recuperar la contraseña.
 * Supabase lo exige cuando se activa en su panel; mientras no haya clave pública, no se
 * muestra nada y los formularios funcionan como siempre. A la mayoría de las personas no
 * les pide nada: sólo aparece si Cloudflare duda.
 */
export function useCaptcha() {
  const ref = useRef<TurnstileInstance>(null);
  const [token, setToken] = useState<string | null>(null);

  return {
    ready: SITE_KEY === null || token !== null,
    token: token ?? undefined,
    // Cada token sirve para un solo intento: después de usarlo se pide otro.
    reset: () => {
      if (!SITE_KEY) return;
      setToken(null);
      ref.current?.reset();
    },
    widget: SITE_KEY ? (
      <Turnstile
        ref={ref}
        siteKey={SITE_KEY}
        options={{ theme: "light", size: "flexible", language: "es", appearance: "interaction-only" }}
        onSuccess={setToken}
        onExpire={() => setToken(null)}
        onError={() => setToken(null)}
      />
    ) : null,
  };
}
