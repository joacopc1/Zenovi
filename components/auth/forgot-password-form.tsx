"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthFeedback, type AuthFeedbackState } from "./auth-feedback";
import {
  AUTH_FIELD_CLASS,
  AUTH_INPUT_CLASS,
  AUTH_PRIMARY_BUTTON_CLASS,
  AUTH_TEXT_LINK_CLASS,
} from "./form-styles";
import { PASSWORD_RESET_RESULT_MESSAGE } from "@/lib/auth/messages";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [status, setStatus] = useState<AuthFeedbackState>({ kind: "idle" });

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus({ kind: "loading" });

    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "").trim();

    if (!email) {
      setStatus({ kind: "error", message: "Ingresá un correo válido." });
      return;
    }

    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
    });

    form.reset();
    setStatus({ kind: "success", message: PASSWORD_RESET_RESULT_MESSAGE });
  }

  const isLoading = status.kind === "loading";

  return (
    <div className="space-y-5">
      <form className="space-y-5" onSubmit={requestReset}>
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
        <button
          className={AUTH_PRIMARY_BUTTON_CLASS}
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Enviando…" : "Recuperar acceso"}
        </button>
      </form>

      <AuthFeedback status={status} />

      <p className="text-center text-xs text-graphite">
        <Link className={AUTH_TEXT_LINK_CLASS} href="/login">
          Volver al inicio de sesión
        </Link>
      </p>
    </div>
  );
}
