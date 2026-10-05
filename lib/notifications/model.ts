/** Lo que se muestra de una notificación y cuándo pasó, en palabras. Puro, para probarlo. */

export const NOTIFICATION_KINDS = ["update", "news", "sync", "analysis", "credits"] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  href: string | null;
  createdAt: string;
  unread: boolean;
};

/** Cuántas se muestran en el menú: las más nuevas. */
export const NOTIFICATIONS_SHOWN = 30;
/** Las novedades para todos dejan de mostrarse a los 60 días. */
export const BROADCAST_DAYS = 60;

/** "Hace 10 minutos", "Hace 2 horas", "Ayer", "Hace 3 días" o la fecha. */
export function relativeTimeLabel(iso: string, now: Date) {
  const seconds = Math.max(0, (now.getTime() - new Date(iso).getTime()) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (minutes < 1) return "Recién";
  if (minutes < 60) return `Hace ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
  if (hours < 24) return `Hace ${hours} ${hours === 1 ? "hora" : "horas"}`;
  if (days === 1) return "Ayer";
  if (days < 7) return `Hace ${days} días`;
  return new Intl.DateTimeFormat("es-UY", { day: "numeric", month: "short", timeZone: "America/Montevideo" }).format(new Date(iso));
}

/** Un enlace de notificación sólo puede llevar a una ruta propia de la app. */
export function safeNotificationHref(href: string | null) {
  return href && /^\/(?!\/)[A-Za-z0-9/_?=&%.-]*$/.test(href) ? href : null;
}
