"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { AuthFeedback, type AuthFeedbackState } from "./auth-feedback";
import { PasswordInput } from "./password-input";
import {
  AUTH_FIELD_CLASS,
  AUTH_INPUT_CLASS,
  AUTH_PRIMARY_BUTTON_CLASS,
} from "./form-styles";
import {
  PASSWORD_MIN_LENGTH,
  SIGN_UP_RESULT_MESSAGE,
} from "@/lib/auth/messages";
import { createClient } from "@/lib/supabase/client";

export function RegisterForm() {
  const [status, setStatus] = useState<AuthFeedbackState>({ kind: "idle" });

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
    await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: displayName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    form.reset();
    setStatus({ kind: "success", message: SIGN_UP_RESULT_MESSAGE });
  }

  const isLoading = status.kind === "loading";

  return (
    <div className="space-y-5">
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

        <button
          className={AUTH_PRIMARY_BUTTON_CLASS}
          type="submit"
          disabled={isLoading}
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
