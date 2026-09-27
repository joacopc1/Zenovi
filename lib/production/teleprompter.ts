/**
 * El apuntador, en la única unidad que significa algo para quien habla.
 *
 * Un apuntador se mide por dentro en píxeles por segundo, que no le dice nada a nadie:
 * cuántos píxeles son "rápido" depende del tamaño de letra y del ancho de la pantalla.
 * Lo que una persona sí reconoce es su propio ritmo al hablar, que ronda las 130-160
 * palabras por minuto. Por eso el número que se muestra se traduce.
 */

/** Las velocidades que se pueden elegir, en píxeles por segundo. */
export const SCROLL_SPEEDS = [15, 20, 25, 30, 40, 50, 60, 75, 90, 110] as const;

/**
 * A cuántas palabras por minuto equivale una velocidad de scroll.
 *
 * Si el texto entero recorre `distance` píxeles a `speed` píxeles por segundo, tarda
 * `distance / speed` segundos, y en ese tiempo pasan todas sus palabras. Devuelve `null`
 * cuando no hay nada que recorrer —un guion corto que entra entero en pantalla—, porque
 * ahí la velocidad no gobierna ningún ritmo y dar un número sería inventarlo.
 */
export function teleprompterWordsPerMinute(
  text: string,
  distance: number,
  speed: number,
): number | null {
  if (distance <= 0 || speed <= 0) return null;

  const words = countWords(text);
  if (words === 0) return null;

  const seconds = distance / speed;
  return Math.round((words / seconds) * 60);
}

/** Palabras de verdad: los espacios de más y los saltos de línea no cuentan. */
export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
}

/**
 * A qué ritmo habla la gente frente a cámara, en palabras por minuto.
 *
 * Es el promedio de una persona explicando algo: ni leyendo un texto ni charlando. Sirve
 * para anticipar cuánto dura un guion antes de grabarlo, no para cronometrar nada.
 */
export const SPOKEN_WORDS_PER_MINUTE = 145;

/** Cuánto dura un guion dicho en voz alta, leído como "1:05" o "0:28". */
export function formatSpokenDuration(words: number): string {
  const seconds = Math.round((words / SPOKEN_WORDS_PER_MINUTE) * 60);
  const minutes = Math.floor(seconds / 60);

  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}
