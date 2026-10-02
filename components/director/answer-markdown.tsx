"use client";

import { Streamdown, type Components } from "streamdown";
import { AnswerLink } from "./answer-link";

// `Components` de streamdown suma una firma genérica por clave que ningún componente tipado
// cumple; el mapa se declara con su tipo para que `a` reciba las props de un enlace.
const ANSWER_COMPONENTS = { a: AnswerLink } as Components;

/**
 * El texto de una respuesta, en Markdown. Vive aparte porque Streamdown pesa: un chat nuevo,
 * todavía sin respuestas, no lo descarga.
 */
export default function AnswerMarkdown({ text, streaming }: { text: string; streaming: boolean }) {
  return (
    <Streamdown isAnimating={streaming} components={ANSWER_COMPONENTS}>
      {text}
    </Streamdown>
  );
}
