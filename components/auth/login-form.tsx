"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type FormStatus =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export function LoginForm() {
  const [status, setStatus] = useState<FormStatus>({ kind: "idle" });

  async function continueWithGoogle() {
    setStatus({ kind: "loading" });
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setStatus({ kind: "error", message: "No pudimos iniciar con Google. Revisá la configuración del proveedor." });
    }
  }

  async function sendMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ kind: "loading" });
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    if (!email) {
      setStatus({ kind: "error", message: "Ingresá un correo válido." });
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setStatus({ kind: "error", message: "No pudimos enviar el enlace. Probá nuevamente." });
      return;
    }

    setStatus({ kind: "success", message: "Te enviamos un enlace seguro. Revisá tu correo." });
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

      <form className="space-y-3" onSubmit={sendMagicLink}>
        <label className="block text-xs font-semibold text-graphite" htmlFor="email">
          Correo electrónico
        </label>
        <input
          className="h-11 w-full rounded-control border border-mist-strong bg-control px-3.5 text-sm text-ink placeholder:text-muted hover:border-graphite focus:border-ink focus:outline-none"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="vos@empresa.com"
          disabled={isLoading}
          required
        />
        <button
          className="h-11 w-full rounded-control bg-ink px-4 text-sm font-semibold text-paper transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Conectando…" : "Recibir enlace de acceso"}
        </button>
      </form>

      {status.kind === "success" || status.kind === "error" ? (
        <p
          className={`rounded-control border px-3 py-2.5 text-xs leading-5 ${
            status.kind === "success"
              ? "border-success/20 bg-success/5 text-success"
              : "border-danger/20 bg-danger/5 text-danger"
          }`}
          role="status"
        >
          {status.message}
        </p>
      ) : null}
    </div>
  );
}
