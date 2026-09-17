"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Desconectar Instagram y borrar sus datos, con confirmación en dos pasos.
 *
 * El primer botón sólo abre la confirmación: borrar es inmediato e irreversible, así que
 * nunca puede pasar con un solo click. La confirmación dice exactamente qué se borra y
 * qué no, para que nadie lo haga creyendo que es un "cerrar sesión".
 */
export function DisconnectInstagram({ username }: { username: string | null }) {
  const [confirming, setConfirming] = useState(false);
  const status = useSearchParams().get("disconnect");

  return (
    <section className="mt-8 max-w-3xl rounded-card border border-mist bg-paper p-5">
      <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Desconectar Instagram</h2>

      {status === "done" ? (
        <p className="font-support mt-2 text-sm leading-6 text-success">
          Listo: desconectamos Instagram y borramos todos sus datos de Zenovi.
        </p>
      ) : null}
      {status === "error" ? (
        <p className="font-support mt-2 text-sm leading-6 text-danger">
          No pudimos completar el borrado. No se borró nada; probá de nuevo en unos minutos.
        </p>
      ) : null}

      {username === null ? (
        <p className="font-support mt-2 text-sm leading-6 text-graphite">No hay ninguna cuenta conectada.</p>
      ) : confirming ? (
        <form action="/api/integrations/instagram/disconnect" method="post" className="mt-3">
          <p className="font-support text-sm leading-6 text-graphite">
            Vamos a borrar todo lo que Zenovi guarda de <span className="font-medium text-ink">{username}</span>: el
            perfil, el contenido sincronizado, sus métricas y el acceso a la cuenta. No se puede deshacer. Tu
            cuenta de Instagram no se toca, y podés volver a conectarla cuando quieras.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="submit"
              className="inline-flex min-h-9 items-center rounded-control bg-danger px-4 text-sm font-semibold text-paper hover:bg-danger/90"
            >
              Desconectar y borrar datos
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="inline-flex min-h-9 items-center rounded-control border border-mist px-4 text-sm font-medium text-ink hover:border-mist-strong"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <p className="font-support text-sm leading-6 text-graphite">
            Quita el acceso de Zenovi a {username} y borra todos sus datos.
          </p>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="inline-flex min-h-9 items-center rounded-control border border-mist px-4 text-sm font-medium text-danger hover:border-danger/40"
          >
            Desconectar
          </button>
        </div>
      )}
    </section>
  );
}
