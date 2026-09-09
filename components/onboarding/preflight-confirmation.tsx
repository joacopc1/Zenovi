"use client";

import { useState } from "react";

export function PreflightConfirmation({
  oauthAvailable,
  errorMessage,
}: {
  oauthAvailable: boolean;
  errorMessage?: string;
}) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="mt-5">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-ink"
        />
        <span>
          <strong className="block text-sm font-medium">
            Mi cuenta es de Creador o Empresa
          </strong>
          <span className="mt-0.5 block text-xs leading-5 text-muted">
            Podés comprobarlo en Instagram, dentro de Tipo de cuenta.
          </span>
        </span>
      </label>

      <form action="/api/integrations/instagram/oauth-attempts" method="post">
        <button
          type="submit"
          disabled={!confirmed || !oauthAvailable}
          className="mt-5 h-12 w-full rounded-[12px] bg-ink px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
        >
          Conectar con Instagram
        </button>
      </form>
      <p
        className={`mt-2 text-center text-xs leading-5 ${errorMessage || (confirmed && !oauthAvailable) ? "text-warning" : "text-muted"}`}
        aria-live="polite"
      >
        {errorMessage ?? getHelperMessage({ confirmed, oauthAvailable })}
      </p>
    </div>
  );
}

function getHelperMessage({
  confirmed,
  oauthAvailable,
}: {
  confirmed: boolean;
  oauthAvailable: boolean;
}) {
  if (!oauthAvailable) {
    return "Falta terminar la configuración segura de Meta para habilitar la conexión.";
  }

  if (confirmed) {
    return "Instagram abrirá su autorización oficial para que elijas la cuenta.";
  }

  return "Confirmá el tipo de cuenta para continuar.";
}
