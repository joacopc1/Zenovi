"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { useCaptcha } from "./captcha";
import { AUTH_TEXT_LINK_CLASS } from "./form-styles";
import { EMAIL_CODE_FAILURE_MESSAGE, EMAIL_CODE_LENGTH, EMAIL_CODE_RESEND_SECONDS } from "@/lib/auth/messages";
import { createClient } from "@/lib/supabase/client";

/**
 * El mail de Supabase sólo trae código cuando se puede editar su plantilla, y eso exige
 * correo propio (SMTP). Hasta entonces llega un enlace: la pantalla pide abrirlo.
 */
const EMAIL_CODE_ENABLED = process.env.NEXT_PUBLIC_AUTH_EMAIL_CODE === "true";

/**
 * Confirmar el correo después de registrarse, sin salir de Zenovi. Con código: se puede
 * pegar entero, se envía solo al completarlo. En los dos casos se puede pedir otro mail.
 */
export function EmailCodeForm({ email, onBack }: { email: string; onBack: () => void }) {
  const router = useRouter();
  const captcha = useCaptcha();
  const [digits, setDigits] = useState<string[]>(() => Array(EMAIL_CODE_LENGTH).fill(""));
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(EMAIL_CODE_RESEND_SECONDS);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (EMAIL_CODE_ENABLED) inputs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function verify(code: string) {
    setChecking(true);
    setError(null);
    const { error: verifyError } = await createClient().auth.verifyOtp({ email, token: code, type: "email" });
    if (verifyError) {
      setChecking(false);
      setError(EMAIL_CODE_FAILURE_MESSAGE);
      setDigits(Array(EMAIL_CODE_LENGTH).fill(""));
      inputs.current[0]?.focus();
      return;
    }
    router.replace("/onboarding/workspace");
    router.refresh();
  }

  function fill(from: number, value: string) {
    const typed = value.replace(/\D/g, "").slice(0, EMAIL_CODE_LENGTH - from).split("");
    if (typed.length === 0) return;
    const next = [...digits];
    typed.forEach((digit, offset) => (next[from + offset] = digit));
    setDigits(next);
    setError(null);
    const code = next.join("");
    if (code.length === EMAIL_CODE_LENGTH && !next.includes("")) {
      void verify(code);
      return;
    }
    inputs.current[Math.min(from + typed.length, EMAIL_CODE_LENGTH - 1)]?.focus();
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      const next = [...digits];
      next[index - 1] = "";
      setDigits(next);
      inputs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) inputs.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < EMAIL_CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
  }

  function handlePaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    fill(index, event.clipboardData.getData("text"));
  }

  async function resend() {
    setError(null);
    const { error: resendError } = await createClient().auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding/workspace`,
        captchaToken: captcha.token,
      },
    });
    captcha.reset();
    // Igual que al registrarse: la respuesta no dice si la cuenta existe.
    setNotice(resendError ? null : EMAIL_CODE_ENABLED ? "Te mandamos un código nuevo." : "Te mandamos el enlace de nuevo.");
    if (resendError) setError("No pudimos volver a enviarlo. Probá de nuevo en un momento.");
    setCooldown(EMAIL_CODE_RESEND_SECONDS);
  }

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-1.5">
        <p className="mx-auto max-w-[34ch] text-sm leading-5 text-graphite">
          {EMAIL_CODE_ENABLED
            ? `Te mandamos un código de ${EMAIL_CODE_LENGTH} dígitos a`
            : "Te mandamos un enlace a"}
          <span className="block truncate font-medium text-ink">{email}</span>
        </p>
        {EMAIL_CODE_ENABLED ? null : (
          <p className="mx-auto max-w-[34ch] text-xs leading-5 text-muted">Abrilo desde este navegador para confirmar tu cuenta y seguir con tu marca.</p>
        )}
      </div>

      {EMAIL_CODE_ENABLED ? <fieldset disabled={checking} className="flex justify-center gap-2">
        <legend className="sr-only">Código de confirmación</legend>
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              inputs.current[index] = element;
            }}
            value={digit}
            onChange={(event) => fill(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={(event) => handlePaste(index, event)}
            onFocus={(event) => event.target.select()}
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={EMAIL_CODE_LENGTH}
            aria-label={`Dígito ${index + 1}`}
            className={`size-12 rounded-[14px] border bg-white text-center text-xl font-semibold text-ink tabular-nums transition-colors focus:border-ink focus:outline-none disabled:opacity-60 ${
              error ? "border-danger/60" : "border-[#cacac8]"
            }`}
          />
        ))}
      </fieldset> : null}

      {error ? (
        <p className="text-xs text-danger" role="alert">{error}</p>
      ) : checking ? (
        <p className="text-xs text-graphite" role="status">Verificando…</p>
      ) : notice ? (
        <p className="text-xs text-graphite" role="status">{notice}</p>
      ) : null}

      <div className="space-y-3">
        {captcha.widget}
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0 || !captcha.ready || checking}
          className="h-11 w-full rounded-[12px] border border-[#cacac8] bg-white px-4 text-sm font-medium text-ink transition-colors hover:bg-[#f7f7f6] disabled:cursor-not-allowed disabled:text-muted disabled:hover:bg-white"
        >
          {cooldown > 0
            ? `Volver a enviar en ${cooldown} s`
            : EMAIL_CODE_ENABLED ? "Pedir otro código" : "Volver a enviar el enlace"}
        </button>
        <p className="text-xs text-graphite">
          ¿Te equivocaste de correo?{" "}
          <button type="button" onClick={onBack} className={AUTH_TEXT_LINK_CLASS}>
            Volver
          </button>
        </p>
      </div>
    </div>
  );
}
