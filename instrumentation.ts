import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") await import("./sentry.server.config");
  if (process.env.NEXT_RUNTIME === "edge") await import("./sentry.edge.config");
}

// Los errores de páginas, acciones y rutas del servidor llegan a Sentry con la ruta que falló.
export const onRequestError = Sentry.captureRequestError;
