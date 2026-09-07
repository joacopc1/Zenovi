"use client";

import { useState } from "react";

export function PreflightConfirmation() {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="mt-8">
      <label className="flex cursor-pointer items-start gap-3 rounded-control border border-mist p-4 hover:border-mist-strong">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          className="mt-0.5 size-4 accent-ink"
        />
        <span>
          <strong className="block text-[13px] font-semibold">
            Confirmo que la cuenta es de Creador o Empresa
          </strong>
          <span className="mt-1 block text-[11px] leading-4 text-muted">
            Si no estás seguro, podés comprobarlo en Instagram → Configuración → Tipo de cuenta.
          </span>
        </span>
      </label>

      <button
        type="button"
        disabled
        className="mt-4 min-h-11 w-full rounded-control bg-ink px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-ink/35 sm:w-auto"
      >
        Conectar con Instagram
      </button>
      <p className={`mt-2 text-[10px] leading-4 ${confirmed ? "text-warning" : "text-muted"}`} aria-live="polite">
        {confirmed
          ? "Preflight confirmado. La autorización real se habilitará al conectar OAuth de Meta."
          : "Confirmá el tipo de cuenta para continuar."}
      </p>
    </div>
  );
}
