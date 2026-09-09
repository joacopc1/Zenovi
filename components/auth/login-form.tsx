"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthFeedback, type AuthFeedbackState } from "./auth-feedback";
import { AuthDivider, GoogleAuthButton } from "./google-auth-button";
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
      <GoogleAuthButton
        label="Continuar con Google"
        enabled={googleEnabled}
        disabled={isLoading}
        onClick={continueWithGoogle}
      />

      <AuthDivider />

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
