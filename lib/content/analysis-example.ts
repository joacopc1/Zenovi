import type { ReelAnalysis } from "./analysis";

/**
 * Un análisis de ejemplo, sólo para mirar la pantalla mientras el pipeline no existe.
 *
 * Nunca se muestra en producción: la vista de detalle lo usa únicamente en desarrollo y
 * con `?ejemplo=1` en la dirección. Se borra junto con el resto cuando el análisis real
 * empiece a guardarse.
 */
export const EXAMPLE_ANALYSIS: ReelAnalysis = {
  pipelineVersion: "ejemplo",
  completedAt: "2026-09-19T12:00:00Z",
  summary:
    "El Reel promete una forma concreta de conseguir clientes sin perseguir a nadie y la cumple a medias: la idea principal llega recién a los 14 segundos, después de una presentación que no agrega nada. Rindió por encima de tu promedio en guardados, que es la señal de que el contenido sirve, pero pierde gente en la apertura.",
  hook: {
    claim:
      "El gancho es una pregunta dirigida al problema de quien mira, pero tarda: los primeros tres segundos se van en una presentación personal.",
    evidence: [
      { atMs: 0, quote: "Hola, soy Joaco y hoy les quiero contar algo que me pasó…" },
      { atMs: 4200, quote: "¿Por qué tenés que perseguir clientes que no te contestan?" },
    ],
  },
  promise: {
    claim: "Promete un método repetible, y lo cumple parcialmente: muestra el qué, no el cómo.",
    evidence: [{ atMs: 9000, quote: "Te muestro los tres pasos que uso yo para que te escriban ellos." }],
  },
  structure: [
    { label: "Presentación", fromMs: 0, toMs: 4000, note: "Se presenta sin dar contexto del problema." },
    { label: "Problema", fromMs: 4000, toMs: 14000, note: "Nombra el dolor con un ejemplo concreto." },
    { label: "Método", fromMs: 14000, toMs: 38000, note: "Tres pasos, el tercero apurado." },
    { label: "Cierre", fromMs: 38000, toMs: 44000, note: "Invita a comentar una palabra." },
  ],
  delivery: {
    claim:
      "Hablás a cámara sin cortes durante los primeros 14 segundos. Los cortes aparecen recién en el método, donde el ritmo mejora.",
    evidence: [{ atMs: 14000, quote: "Primero: dejá de escribirle a gente que no te pidió nada." }],
  },
  callToAction: {
    claim: "El cierre pide un comentario, pero no dice qué recibe quien comenta.",
    evidence: [{ atMs: 39500, quote: "Comentá la palabra MÉTODO y te cuento." }],
  },
  recommendations: [
    { kind: "keep", text: "La pregunta del segundo 4: es la parte que mejor retiene." },
    { kind: "change", text: "Arrancá por esa pregunta y dejá la presentación para el final, o sacala." },
    { kind: "test", text: "Decir qué recibe quien comenta, en lugar de sólo pedir la palabra." },
  ],
  transcript: [
    { atMs: 0, quote: "Hola, soy Joaco y hoy les quiero contar algo que me pasó con un cliente." },
    { atMs: 4200, quote: "¿Por qué tenés que perseguir clientes que no te contestan?" },
    { atMs: 9000, quote: "Te muestro los tres pasos que uso yo para que te escriban ellos." },
    { atMs: 14000, quote: "Primero: dejá de escribirle a gente que no te pidió nada." },
    { atMs: 39500, quote: "Comentá la palabra MÉTODO y te cuento." },
  ],
};
