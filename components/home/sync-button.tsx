"use client";

import { useEffect, useState, type SVGProps } from "react";

/**
 * Lanza una sincronización. Es un envío de formulario común —no una acción de React—,
 * así que el estado de carga se lleva a mano: se activa al enviar y dura hasta que la
 * redirección trae la página nueva.
 */
export function SyncButton({ redirectTo }: { redirectTo: string }) {
  const [pending, setPending] = useState(false);

  // Al volver con el botón "atrás", el navegador restaura la página tal cual quedó:
  // sin esto el botón seguiría girando para siempre.
  useEffect(() => {
    const reset = (event: PageTransitionEvent) => {
      if (event.persisted) setPending(false);
    };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  return (
    <form
      action="/api/integrations/instagram/sync"
      method="post"
      className="flex items-center gap-2"
      onSubmit={(event) => {
        // Un segundo clic lanzaría otra sincronización completa en paralelo.
        if (pending) {
          event.preventDefault();
          return;
        }
        setPending(true);
      }}
    >
      <input type="hidden" name="redirectTo" value={redirectTo} />
      {pending ? (
        <span className="hidden text-xs text-muted sm:inline">Puede tardar hasta un minuto</span>
      ) : null}
      <button
        type="submit"
        aria-disabled={pending}
        className={`flex min-h-8 items-center gap-1.5 rounded-control border border-mist bg-paper px-3 text-xs font-medium ${
          pending ? "cursor-progress text-ink" : "text-graphite hover:border-mist-strong hover:text-ink"
        }`}
      >
        <RefreshIcon className={`size-3.5 ${pending ? "animate-spin motion-reduce:animate-none" : ""}`} />
        {pending ? "Actualizando…" : "Actualizar"}
      </button>
      <span aria-live="polite" className="sr-only">
        {pending ? "Actualizando los datos de Instagram. Puede tardar hasta un minuto." : ""}
      </span>
    </form>
  );
}

function RefreshIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}
