/**
 * Una fila incrustada en otra consulta.
 *
 * Supabase devuelve una relación incrustada como objeto o como lista según cómo infiera
 * la cardinalidad, y esa inferencia cambia con el esquema. Leer las dos formas evita que
 * una consulta que hoy trae un objeto rompa mañana porque empezó a traer una lista.
 */
export function readEmbeddedRow<T>(value: unknown): T | null {
  const row = Array.isArray(value) ? value[0] : value;
  return typeof row === "object" && row !== null ? (row as T) : null;
}
