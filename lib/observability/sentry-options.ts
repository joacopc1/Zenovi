import type { ErrorEvent } from "@sentry/nextjs";

/**
 * Lo común a navegador y servidor. Sentry sólo recibe errores, nunca datos de la persona:
 * ni mails, ni IPs, ni cookies, ni lo que escribe en el Director o en sus ideas.
 */
export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() || undefined;

const SENSITIVE_HEADERS = ["cookie", "authorization", "x-forwarded-for", "x-real-ip"];

export function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.user) event.user = event.user.id ? { id: event.user.id } : undefined;
  if (event.request) {
    // El cuerpo puede traer un mensaje al Director o un guion: no sale de Zenovi.
    delete event.request.data;
    delete event.request.cookies;
    if (event.request.headers) {
      for (const header of Object.keys(event.request.headers)) {
        if (SENSITIVE_HEADERS.includes(header.toLowerCase())) delete event.request.headers[header];
      }
    }
  }
  return event;
}

export const sharedSentryOptions = {
  dsn: SENTRY_DSN,
  enabled: Boolean(SENTRY_DSN),
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  sendDefaultPii: false,
  // Sólo errores: medir rendimiento suma peso y cuota sin que hoy lo necesitemos.
  tracesSampleRate: 0,
  beforeSend: scrubEvent,
};
