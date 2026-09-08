"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthFeedback, type AuthFeedbackState } from "./auth-feedback";
import {
  AUTH_INPUT_CLASS,
  AUTH_PRIMARY_BUTTON_CLASS,
  AUTH_TEXT_LINK_CLASS,
} from "./form-styles";
import { SIGN_IN_FAILURE_MESSAGE } from "@/lib/auth/messages";
import { createClient } from "@/lib/supabase/client";

type LoginFormProps = {
  initialError?: boolean;
};

export function LoginForm({ initialError = false }: LoginFormProps) {
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
        className="flex h-11 w-full items-center justify-center rounded-control border border-mist-strong bg-paper text-sm font-semibold transition-colors hover:bg-control disabled:cursor-wait disabled:opacity-60"
        type="button"
        onClick={continueWithGoogle}
        disabled={isLoading}
      >
        Continuar con Google
      </button>

      <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.1em] text-muted">
        <span className="h-px flex-1 bg-mist" />
        o con correo
        <span className="h-px flex-1 bg-mist" />
      </div>

      <form className="space-y-3" onSubmit={signInWithPassword}>
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
        <div className="flex items-center justify-between gap-3">
          <label className="block text-xs font-semibold text-graphite" htmlFor="password">
            Contraseña
          </label>
          <Link className="text-xs font-medium text-graphite underline underline-offset-4" href="/forgot-password">
            ¿La olvidaste?
          </Link>
        </div>
        <input
          className={AUTH_INPUT_CLASS}
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Tu contraseña"
          disabled={isLoading}
          required
        />
        <button
          className={AUTH_PRIMARY_BUTTON_CLASS}
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Entrando…" : "Iniciar sesión"}
        </button>
      </form>

      <AuthFeedback status={status} />

      <p className="text-center text-xs text-graphite">
        ¿Todavía no tenés cuenta?{" "}
        <Link className={AUTH_TEXT_LINK_CLASS} href="/register">
          Crear cuenta
        </Link>
      </p>
    </div>
  );
}
