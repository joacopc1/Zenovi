"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthFeedback, type AuthFeedbackState } from "./auth-feedback";
import {
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
    setStatus({ kind: "loading" });

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    if (!email) {
      setStatus({ kind: "error", message: "Ingresá un correo válido." });
      return;
    }

    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
    });

    event.currentTarget.reset();
    setStatus({ kind: "success", message: PASSWORD_RESET_RESULT_MESSAGE });
  }

  const isLoading = status.kind === "loading";

  return (
    <div className="space-y-5">
      <form className="space-y-3" onSubmit={requestReset}>
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
