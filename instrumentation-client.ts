import * as Sentry from "@sentry/nextjs";
import { sharedSentryOptions } from "@/lib/observability/sentry-options";

Sentry.init({
  ...sharedSentryOptions,
  // Ruido que no es de Zenovi: extensiones del navegador y cortes de red de la persona.
  ignoreErrors: ["ResizeObserver loop", "Failed to fetch", "Load failed", "NetworkError"],
  denyUrls: [/^chrome-extension:\/\//, /^moz-extension:\/\//, /^safari-web-extension:\/\//],
});
