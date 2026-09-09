"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthFeedback, type AuthFeedbackState } from "./auth-feedback";
import { PasswordInput } from "./password-input";
import {
  AUTH_FIELD_CLASS,
  AUTH_INPUT_CLASS,
  AUTH_PRIMARY_BUTTON_CLASS,
} from "./form-styles";
import { SIGN_IN_FAILURE_MESSAGE } from "@/lib/auth/messages";
import { createClient } from "@/lib/supabase/client";

type LoginFormProps = {
  initialError?: boolean;
  googleEnabled?: boolean;
};

export function LoginForm({
  initialError = false,
  googleEnabled = false,
}: LoginFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<AuthFeedbackState>(
    initialError
      ? { kind: "error", message: SIGN_IN_FAILURE_MESSAGE }
      : { kind: "idle" },
  );

  async function continueWithGoogle() {
    setStatus({ kind: "loading" });
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setStatus({ kind: "error", message: SIGN_IN_FAILURE_MESSAGE });
    }
  }

  async function signInWithPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ kind: "loading" });
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setStatus({ kind: "error", message: SIGN_IN_FAILURE_MESSAGE });
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setStatus({ kind: "error", message: SIGN_IN_FAILURE_MESSAGE });
      return;
    }

    router.replace("/");
    router.refresh();
  }

  const isLoading = status.kind === "loading";

  return (
    <div className="space-y-5">
      <button
        className="flex h-12 w-full items-center justify-center gap-2.5 rounded-[14px] border border-[#cacac8] bg-white text-sm font-medium text-ink transition-colors enabled:hover:bg-[#f7f7f6] disabled:cursor-not-allowed disabled:text-ink"
        type="button"
        onClick={googleEnabled ? continueWithGoogle : undefined}
        disabled={isLoading || !googleEnabled}
        aria-label={googleEnabled ? "Continuar con Google" : "Continuar con Google, próximamente"}
      >
        <GoogleMark />
        Continuar con Google
        {!googleEnabled ? <span className="sr-only"> (próximamente)</span> : null}
      </button>

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-mist" />
        o
        <span className="h-px flex-1 bg-mist" />
      </div>

      <form className="space-y-5" onSubmit={signInWithPassword}>
        <div className={AUTH_FIELD_CLASS}>
          <label className="block text-sm font-medium text-ink" htmlFor="email">
            Correo electrónico
          </label>
          <input
            className={AUTH_INPUT_CLASS}
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="tu@ejemplo.com"
            disabled={isLoading}
            required
          />
        </div>

        <div className={AUTH_FIELD_CLASS}>
          <div className="flex items-center justify-between gap-3">
            <label className="block text-sm font-medium text-ink" htmlFor="password">
              Contraseña
            </label>
            <Link className="text-xs text-muted hover:text-ink" href="/forgot-password">
              ¿La olvidaste?
            </Link>
          </div>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="Tu contraseña"
            disabled={isLoading}
            required
          />
        </div>

        <button
          className={AUTH_PRIMARY_BUTTON_CLASS}
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Entrando…" : "Iniciar sesión"}
        </button>
      </form>

      <AuthFeedback status={status} />
    </div>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[18px] shrink-0">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.43l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.86A6 6 0 0 1 6.07 12c0-.65.11-1.27.32-1.86V7.52H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.48l3.35-2.62Z" />
      <path fill="#EA4335" d="M12 6.01c1.47 0 2.79.51 3.83 1.5l2.87-2.88A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.96 5.52l3.35 2.62C7.18 7.77 9.39 6.01 12 6.01Z" />
    </svg>
  );
}
