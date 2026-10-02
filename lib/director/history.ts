import type { ModelMessage, UIMessage } from "ai";

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

const CACHE_BREAKPOINT = { anthropic: { cacheControl: { type: "ephemeral" } } } as const;

/**
 * Marca el final de la conversación para la caché de Anthropic. Cada mensaje reenvía todo
 * lo anterior; con la marca, eso se lee de la caché al 10 % del precio, tanto en los pasos
 * con herramientas de esta respuesta como en el próximo mensaje. No resume ni recorta nada:
 * el Director sigue leyendo la conversación entera, sólo que más barata.
 */
export function withCachedHistory(messages: ModelMessage[]): ModelMessage[] {
  if (messages.length === 0) return messages;
  const last = messages.at(-1)!;
  return [
    ...messages.slice(0, -1),
    { ...last, providerOptions: { ...last.providerOptions, ...CACHE_BREAKPOINT } } as ModelMessage,
  ];
}
