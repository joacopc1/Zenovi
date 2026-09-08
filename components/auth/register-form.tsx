"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthFeedback, type AuthFeedbackState } from "./auth-feedback";
import {
  AUTH_INPUT_CLASS,
  AUTH_PRIMARY_BUTTON_CLASS,
  AUTH_TEXT_LINK_CLASS,
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
    setStatus({ kind: "loading" });

    const formData = new FormData(event.currentTarget);
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

    event.currentTarget.reset();
    setStatus({ kind: "success", message: SIGN_UP_RESULT_MESSAGE });
  }

  const isLoading = status.kind === "loading";

  return (
    <div className="space-y-5">
      <form className="space-y-3" onSubmit={register}>
        <label className="block text-xs font-semibold text-graphite" htmlFor="displayName">
          Nombre
        </label>
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

        <label className="block text-xs font-semibold text-graphite" htmlFor="email">
          Correo electrónico
        </label>
        <input
          className={AUTH_INPUT_CLASS}
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="vos@empresa.com"
          disabled={isLoading}
          required
        />

        <label className="block text-xs font-semibold text-graphite" htmlFor="password">
          Contraseña
        </label>
        <input
          className={AUTH_INPUT_CLASS}
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder={`Mínimo ${PASSWORD_MIN_LENGTH} caracteres`}
          minLength={PASSWORD_MIN_LENGTH}
          disabled={isLoading}
          required
        />

        <button
          className={AUTH_PRIMARY_BUTTON_CLASS}
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Creando…" : "Crear cuenta"}
        </button>
      </form>

      <AuthFeedback status={status} />

      <p className="text-center text-xs text-graphite">
        ¿Ya tenés cuenta?{" "}
        <Link className={AUTH_TEXT_LINK_CLASS} href="/login">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
