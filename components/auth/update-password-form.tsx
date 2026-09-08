"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthFeedback, type AuthFeedbackState } from "./auth-feedback";
import { AUTH_INPUT_CLASS, AUTH_PRIMARY_BUTTON_CLASS } from "./form-styles";
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_UPDATE_FAILURE_MESSAGE,
} from "@/lib/auth/messages";
import { createClient } from "@/lib/supabase/client";

export function UpdatePasswordForm() {
  const router = useRouter();
  const [status, setStatus] = useState<AuthFeedbackState>({ kind: "idle" });

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ kind: "loading" });

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmation = String(formData.get("confirmation") ?? "");

    if (password.length < PASSWORD_MIN_LENGTH || password !== confirmation) {
      setStatus({
        kind: "error",
        message: `Las contraseñas deben coincidir y tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`,
      });
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus({ kind: "error", message: PASSWORD_UPDATE_FAILURE_MESSAGE });
      return;
    }

    router.replace("/");
    router.refresh();
  }

  const isLoading = status.kind === "loading";

  return (
    <div className="space-y-5">
      <form className="space-y-3" onSubmit={updatePassword}>
        <label className="block text-xs font-semibold text-graphite" htmlFor="password">
          Nueva contraseña
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

        <label className="block text-xs font-semibold text-graphite" htmlFor="confirmation">
          Repetir contraseña
        </label>
        <input
          className={AUTH_INPUT_CLASS}
          id="confirmation"
          name="confirmation"
          type="password"
          autoComplete="new-password"
          placeholder="Repetí la contraseña"
          minLength={PASSWORD_MIN_LENGTH}
          disabled={isLoading}
          required
        />

        <button
          className={AUTH_PRIMARY_BUTTON_CLASS}
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Guardando…" : "Guardar contraseña"}
        </button>
      </form>

      <AuthFeedback status={status} />
    </div>
  );
}
