"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { AuthFeedback, type AuthFeedbackState } from "./auth-feedback";
import { useCaptcha } from "./captcha";
import { AuthDivider, GoogleAuthButton } from "./google-auth-button";
import { PasswordInput } from "./password-input";
import {
  AUTH_FIELD_CLASS,
  AUTH_INPUT_CLASS,
  AUTH_PRIMARY_BUTTON_CLASS,
} from "./form-styles";
import {
  PASSWORD_MIN_LENGTH,
  SIGN_UP_FAILURE_MESSAGE,
} from "@/lib/auth/messages";
import { createClient } from "@/lib/supabase/client";

export function RegisterForm({
  googleEnabled = false,
  onConfirmationSent,
}: {
  googleEnabled?: boolean;
  /** La cuenta se creó pero falta confirmar el correo: la pantalla pasa al paso del código. */
  onConfirmationSent: (email: string) => void;
}) {
  const router = useRouter();
  const captcha = useCaptcha();
  const [status, setStatus] = useState<AuthFeedbackState>({ kind: "idle" });

  async function continueWithGoogle() {
    setStatus({ kind: "loading" });
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/onboarding/workspace`,
      },
    });

    if (error) {
      setStatus({ kind: "error", message: SIGN_UP_FAILURE_MESSAGE });
    }
  }

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus({ kind: "loading" });

    const formData = new FormData(form);
    const displayName = String(formData.get("displayName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!displayName || !email || password.length < PASSWORD_MIN_LENGTH) {
      setStatus({
        kind: "error",
        message: `Completá los datos y usá una contraseña de al menos ${PASSWORD_MIN_LENGTH} caracteres.`,
      });
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: displayName },
        captchaToken: captcha.token,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding/workspace`,
      },
    });

    if (error) {
      captcha.reset();
      setStatus({ kind: "error", message: SIGN_UP_FAILURE_MESSAGE });
      return;
    }

    if (data.session) {
      router.replace("/onboarding/workspace");
      router.refresh();
      return;
    }

    form.reset();
    setStatus({ kind: "idle" });
    onConfirmationSent(email);
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

      <form className="space-y-5" onSubmit={register}>
        <AuthField label="Nombre" htmlFor="displayName">
          <input
            className={AUTH_INPUT_CLASS}
            id="displayName"
            name="displayName"
            type="text"
            autoComplete="name"
            placeholder="Tu nombre"
            maxLength={80}
            disabled={isLoading}
            required
          />
        </AuthField>

        <AuthField label="Correo electrónico" htmlFor="email">
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
        </AuthField>

        <AuthField label="Contraseña" htmlFor="password">
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            placeholder={`Mínimo ${PASSWORD_MIN_LENGTH} caracteres`}
            minLength={PASSWORD_MIN_LENGTH}
            disabled={isLoading}
            required
          />
        </AuthField>

        {captcha.widget}

        <button
          className={AUTH_PRIMARY_BUTTON_CLASS}
          type="submit"
          disabled={isLoading || !captcha.ready}
        >
          {isLoading ? "Creando…" : "Crear cuenta"}
        </button>
      </form>

      <AuthFeedback status={status} />
    </div>
  );
}

function AuthField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className={AUTH_FIELD_CLASS}>
      <label className="block text-sm font-medium text-ink" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}
