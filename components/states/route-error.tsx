"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { AppHeader } from "@/components/shell/app-header";

/**
 * Estado de error de una ruta del dashboard.
 *
 * Usa `retry()` y no `reset()`: `reset` sólo limpia el límite de error y vuelve a
 * renderizar con los mismos datos fallidos, mientras que `retry` rehace la consulta,
 * que es lo único que puede resolver una caída de carga.
 */
export function RouteError({
  title,
  description,
  error,
  retry,
}: {
  title: string;
  description: string;
  /** El error que mostró esta pantalla: se avisa a Sentry, la persona ve el mensaje de arriba. */
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-[1240px] px-5 py-12 md:px-8 lg:px-10">
        <section className="max-w-xl rounded-card border border-mist p-6">
          <h1 className="text-lg font-semibold">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-graphite">{description}</p>
          <button
            type="button"
            onClick={() => retry()}
            className="mt-5 min-h-9 rounded-control bg-ink px-4 text-sm font-medium text-paper hover:bg-ink/85"
          >
            Reintentar
          </button>
        </section>
      </main>
    </>
  );
}
