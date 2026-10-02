import type { UIMessage } from "ai";

/**
 * Lo que se reenvía al modelo de la conversación guardada.
 *
 * El razonamiento de Claude vuelve firmado y atado al prompt exacto con el que se generó.
 * Ese prompt cambia —cuando mejoramos la capacitación o el creador edita su ADN— y entonces
 * Anthropic rechaza el bloque entero y el chat deja de responder. Para seguir la charla
 * alcanza con lo que se dijo: el razonamiento viejo no se reenvía.
 */
export function historyForModel(messages: readonly UIMessage[]): UIMessage[] {
  return messages.map((message) =>
    message.role === "assistant"
      ? { ...message, parts: message.parts.filter((part) => part.type !== "reasoning") }
      : message,
  );
}

/**
 * Una respuesta que no dejó nada para mostrar (falló o se cortó antes de escribir) no se
 * guarda: dejaría un hueco en el chat. Una idea propuesta cuenta, aunque venga sin texto.
 */
export function hasAnswerText(message: UIMessage) {
  return message.parts.some(
    (part) => (part.type === "text" && part.text.trim().length > 0) || part.type === "tool-proponer_idea",
  );
}
