/**
 * Cuántos pedidos entran por ventana, por operación. Están pensados para que un creador
 * real nunca los toque y un script, sí: una persona no manda 20 mensajes por minuto ni
 * analiza 15 Reels en diez minutos.
 */
export const RATE_LIMITS = {
  /** Mensajes al Director, por persona. */
  director_chat: { limit: 20, windowSeconds: 60 },
  director_chat_hourly: { limit: 200, windowSeconds: 3600 },
  /** Archivos adjuntos, por persona. */
  director_attachment: { limit: 30, windowSeconds: 600 },
  /** Análisis y transcripciones, por workspace. */
  ai_action: { limit: 15, windowSeconds: 600 },
  /** Sincronizar a mano con Instagram, por workspace: cada una son decenas de pedidos a Meta. */
  instagram_sync: { limit: 6, windowSeconds: 3600 },
  /**
   * Intentos de manipular al Director, por persona: abrir chats nuevos para seguir
   * insistiendo no reinicia la cuenta.
   */
  director_injection: { limit: 6, windowSeconds: 3600 },
  /** Empezar una conexión con Instagram, por persona. */
  instagram_oauth: { limit: 10, windowSeconds: 600 },
} as const satisfies Record<string, { limit: number; windowSeconds: number }>;

export type RateLimitRule = keyof typeof RATE_LIMITS;

export function rateLimitKey(rule: RateLimitRule, subject: string) {
  return `${rule}:${subject}`;
}
