/**
 * Comparar texto escrito por personas.
 *
 * Nadie escribe dos veces igual: "Atracción", "atraccion" y "ATRACCIÓN" son lo mismo para
 * quien las escribió, y tratarlas como tres cosas distintas rompe cualquier agrupación,
 * filtro o coincidencia. Acá vive la única forma de aplanar esas diferencias, porque
 * estaba copiada en cuatro lugares y cada copia decidía por su cuenta qué ignorar.
 */

/** Minúsculas y sin tildes. Conserva la puntuación y los espacios tal como vinieron. */
export function foldText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Lo mismo, y además sin puntuación: "¿Guión #1, ya!" y "guion 1 ya" quedan iguales.
 * Sirve para comparar frases enteras, donde los signos no aportan.
 */
export function foldWords(value: string): string {
  return foldText(value)
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Un identificador estable a partir de un texto: "Tipo de contenido" → "tipo-de-contenido". */
export function slugify(value: string): string {
  return foldWords(value).replace(/ /g, "-");
}
