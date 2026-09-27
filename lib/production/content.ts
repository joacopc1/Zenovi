import { foldText, foldWords } from "../text/fold.ts";

export const CONTENT_STATUSES = ["idea", "guion", "produccion", "publicada"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

/**
 * El formato de una pieza planificada es el mismo que el de una pieza publicada: una
 * idea de Reel termina siendo un Reel. Tiene que coincidir con `CONTENT_KINDS` de la
 * biblioteca —es lo que permite vincular las dos sin traducir nada en el medio— y hay un
 * test que falla si alguna de las dos listas se mueve sin la otra.
 */
export const CONTENT_FORMATS = ["reel", "story", "publication"] as const;
export type ContentFormat = (typeof CONTENT_FORMATS)[number];

export const CONTENT_SOURCES = ["manual", "director"] as const;
export type ContentSource = (typeof CONTENT_SOURCES)[number];

/** Orden del pipeline: idea se desarrolla a guión, que avanza a producción y publicada. */
export const CONTENT_PIPELINE: readonly ContentStatus[] = [
  "idea",
  "guion",
  "produccion",
  "publicada",
];

export const STATUS_LABELS: Record<ContentStatus, string> = {
  idea: "Idea",
  guion: "Guión",
  produccion: "En producción",
  publicada: "Publicada",
};

/**
 * Lo que se ve en pantalla, que no tiene por qué ser lo que se guarda: adentro el
 * formato se llama `publication` para coincidir con la biblioteca, y afuera "Post",
 * que es como lo nombra la barra lateral.
 */
export const FORMAT_LABELS: Record<ContentFormat, string> = {
  reel: "Reel",
  story: "Historia",
  publication: "Post",
};

/**
 * Cuántos días se considera que una pieza "salió recién".
 *
 * Después de dos semanas ya no es algo que acabás de publicar: es historial. El tablero
 * es para ver en qué anda la producción, no para guardar todo lo que salió alguna vez.
 */
export const RECENTLY_PUBLISHED_DAYS = 14;

/**
 * Separa lo que salió hace poco de lo que ya es historial.
 *
 * Una pieza publicada sin fecha —las que quedaron de antes de registrarla— se trata como
 * historial: afirmar que salió recién cuando no se sabe sería inventar.
 */
export function splitRecentlyPublished<T extends { publishedAt: string | null }>(
  items: readonly T[],
  now: Date = new Date(),
): { recent: T[]; older: T[] } {
  const cutoff = now.getTime() - RECENTLY_PUBLISHED_DAYS * 86_400_000;
  const recent: T[] = [];
  const older: T[] = [];

  for (const item of items) {
    const published = item.publishedAt === null ? Number.NaN : Date.parse(item.publishedAt);
    if (!Number.isNaN(published) && published >= cutoff) recent.push(item);
    else older.push(item);
  }

  return { recent, older };
}

/**
 * Tipos para arrancar, mientras el creador no tenga los suyos.
 *
 * Una función que aprende del usuario no le da nada el primer día, y alguien que recién
 * empieza no sabe qué escribir en un campo vacío. Estos son los términos que el propio
 * proyecto ya declaró como jerga del rubro, no una taxonomía inventada acá.
 *
 * Son provisionales a propósito: la investigación del avatar pide que el vocabulario se
 * derive de cómo hablan los creadores entrevistados y no del equipo, así que esta lista
 * se reemplaza cuando haya entrevistas, y más adelante el Director es quien debería
 * proponer el tipo mirando la pieza. Nunca son obligatorios: el campo sigue siendo libre
 * y en cuanto el creador escribe los suyos, estos desaparecen.
 */
export const STARTER_CONTENT_TYPES = [
  "Atracción",
  "Autoridad",
  "Nutrición",
  "Conversión",
  "Transaccional",
  "Testimonio",
  "Objeciones",
] as const;

/**
 * Lo que se ofrece en el campo de tipo: lo del creador si ya escribió algo, y si no, los
 * de arranque. No se mezclan: ver los propios entre siete ajenos los esconde.
 */
export function contentTypeSuggestions(own: readonly string[]): readonly string[] {
  return own.length > 0 ? own : STARTER_CONTENT_TYPES;
}

/**
 * Los tipos que el creador viene usando, con cuántas piezas tiene cada uno.
 *
 * Zenovi no impone una lista de pilares ni de categorías: el "tipo de contenido" es el
 * vocabulario del creador —"atracción", "testimonio", "objeciones", lo que sea que él
 * llame así— y la app lo aprende de lo que escribe en vez de pedirle que elija de un
 * menú ajeno. Se comparan sin distinguir mayúsculas ni tildes para que "Atracción" y
 * "atraccion" no se cuenten como dos cosas, y se muestra la forma que escribió primero.
 */
export function collectContentTypes(
  items: readonly { contentType: string }[],
): { value: string; count: number }[] {
  const byKey = new Map<string, { value: string; count: number }>();

  for (const item of items) {
    const value = item.contentType.trim();
    if (value.length === 0) continue;

    const found = byKey.get(foldText(value));
    if (found) found.count += 1;
    else byKey.set(foldText(value), { value, count: 1 });
  }

  return [...byKey.values()].sort(
    (a, b) => b.count - a.count || a.value.localeCompare(b.value, "es"),
  );
}

/**
 * El guion como texto suelto, para copiarlo y pegarlo en otro lado.
 *
 * Con las partes rotuladas y en el orden en que se dicen. Se comparte para que alguien lo
 * lea —un editor, un socio, uno mismo en el teléfono—, y un bloque corrido sin decir dónde
 * empieza el hook y dónde el cierre obliga a adivinarlo.
 */
export function scriptAsText(item: {
  title: string;
  hook: string;
  development: string;
  cta: string;
}): string {
  const partes: string[] = [];

  if (item.title.trim()) partes.push(item.title.trim());
  if (item.hook.trim()) partes.push(`HOOK\n${item.hook.trim()}`);
  if (item.development.trim()) partes.push(`DESARROLLO\n${item.development.trim()}`);
  if (item.cta.trim()) partes.push(`CTA\n${item.cta.trim()}`);

  return partes.join("\n\n");
}

/**
 * ¿Esta pieza responde a lo que se está buscando?
 *
 * Busca en todo lo que el creador escribió —título, tipo, guion y link— porque uno se
 * acuerda de la pieza por cualquiera de esas partes: a veces por el título, a veces por
 * una frase del hook. Sin tildes ni mayúsculas, y por palabras sueltas: escribir "curso
 * errores" encuentra "Los errores que cometí al vender mi primer curso".
 */
export function matchesSearch(
  item: { title: string; contentType: string; hook: string; development: string; cta: string; referenceUrl: string },
  query: string,
): boolean {
  const words = foldWords(query).split(" ").filter(Boolean);
  if (words.length === 0) return true;

  const haystack = foldWords(
    `${item.title} ${item.contentType} ${item.hook} ${item.development} ${item.cta} ${item.referenceUrl}`,
  );

  return words.every((word) => haystack.includes(word));
}

/** ¿Esta pieza lleva este tipo? Misma comparación laxa que al agruparlos. */
export function matchesContentType(item: { contentType: string }, type: string): boolean {
  return foldText(item.contentType.trim()) === foldText(type.trim());
}

/**
 * El color de cada estado, compartido por el tablero y el calendario.
 *
 * Es el mismo punto en los dos lados a propósito: quien aprende que el verde es
 * "publicada" mirando el pipeline no tiene que volver a aprenderlo en el calendario.
 */
export const STATUS_COLORS: Record<ContentStatus, string> = {
  idea: "var(--color-graphite)",
  guion: "var(--color-data)",
  produccion: "var(--color-warning)",
  publicada: "var(--color-success)",
};

/**
 * Una fecha "YYYY-MM-DD" leída al mediodía.
 *
 * Interpretarla a medianoche la corre un día para atrás en zonas al oeste de Greenwich,
 * que es justo donde vive el usuario: el mediodía deja margen en las dos direcciones.
 */
export function parseTargetDate(value: string): Date {
  return new Date(`${value}T12:00:00`);
}

export function formatTargetDate(value: string, style: "short" | "long" = "long"): string {
  return parseTargetDate(value).toLocaleDateString(
    "es-UY",
    style === "short"
      ? { day: "numeric", month: "short" }
      : { day: "numeric", month: "long", year: "numeric" },
  );
}

export type ContentItemDraft = {
  title: string;
  contentType: string;
  format: ContentFormat;
  status: ContentStatus;
  targetDate: string | null;
  referenceUrl: string;
  hook: string;
  development: string;
  cta: string;
  source: ContentSource;
};

export type ContentItemFieldErrors = Partial<Record<keyof ContentItemDraft, string>>;

export type ContentItemValidation =
  | { ok: true; value: ContentItemDraft }
  | { ok: false; errors: ContentItemFieldErrors };

export function emptyContentItem(): ContentItemDraft {
  return {
    title: "",
    contentType: "",
    format: "reel",
    status: "idea",
    targetDate: null,
    referenceUrl: "",
    hook: "",
    development: "",
    cta: "",
    source: "manual",
  };
}

const LIMITS = {
  title: 200,
  contentType: 120,
  hook: 2000,
  development: 8000,
  cta: 1000,
  referenceUrl: 500,
} as const;

/**
 * Normaliza una entrada no confiable a un `ContentItemDraft` limpio. Corta por
 * longitud, valida enums y descarta valores inválidos; nunca confía en la forma
 * de la data que llega del cliente.
 */
export function sanitizeContentItem(raw: unknown): ContentItemValidation {
  const source = asRecord(raw);
  const errors: ContentItemFieldErrors = {};

  const format = isContentFormat(source.format) ? source.format : "reel";
  const status = isContentStatus(source.status) ? source.status : "idea";
  const itemSource = isContentSource(source.source) ? source.source : "manual";

  const title = sanitizeText(source.title, LIMITS.title);
  const referenceUrl = sanitizeText(source.referenceUrl, LIMITS.referenceUrl);

  // Alcanza con una de las dos: una idea nace muchas veces como un link pegado al pasar,
  // y exigirle un título en ese momento es pedirle a alguien que nombre lo que todavía no
  // pensó. Sin ninguna de las dos no hay idea que guardar.
  if (title.length === 0 && referenceUrl.length === 0) {
    errors.title = "Poné un título o pegá un link de referencia.";
  }

  const value: ContentItemDraft = {
    title,
    contentType: sanitizeText(source.contentType, LIMITS.contentType),
    format,
    status,
    targetDate: sanitizeDate(source.targetDate),
    referenceUrl,
    hook: sanitizeText(source.hook, LIMITS.hook),
    development: sanitizeText(source.development, LIMITS.development),
    cta: sanitizeText(source.cta, LIMITS.cta),
    source: itemSource,
  };

  return Object.keys(errors).length === 0 ? { ok: true, value } : { ok: false, errors };
}

export function isContentStatus(value: unknown): value is ContentStatus {
  return typeof value === "string" && (CONTENT_STATUSES as readonly string[]).includes(value);
}

export function isContentFormat(value: unknown): value is ContentFormat {
  return typeof value === "string" && (CONTENT_FORMATS as readonly string[]).includes(value);
}

export function isContentSource(value: unknown): value is ContentSource {
  return typeof value === "string" && (CONTENT_SOURCES as readonly string[]).includes(value);
}

/**
 * A qué columna cae una tarjeta al soltarla.
 *
 * dnd-kit elige el destino por proporción de superposición, no por tamaño, así que una
 * tarjeta —del mismo tamaño que la arrastrada— siempre le gana a la columna que la
 * contiene. Por eso el destino se resuelve primero por el estado que cada tarjeta lleva
 * consigo, y sólo si no lo trae se interpreta el id como el de una columna. Leer sólo el
 * id hacía que soltar sobre otra tarjeta no hiciera nada.
 */
export function resolveDropStatus(overId: unknown, overData?: unknown): ContentStatus | null {
  const carried = asRecord(overData).status;
  if (isContentStatus(carried)) return carried;

  return isContentStatus(overId) ? overId : null;
}

/**
 * Cómo se llama una pieza en pantalla.
 *
 * Una idea guardada sólo con su link no tiene título todavía: se la nombra con el link,
 * que es lo único que su autor eligió, en vez de mostrar un hueco.
 */
export function contentItemName(item: { title: string; referenceUrl: string }): string {
  if (item.title.length > 0) return item.title;
  if (item.referenceUrl.length > 0) return shortReference(item.referenceUrl);
  return "Sin título";
}

/** El link acortado: dominio y final del camino, que es lo que lo hace reconocible. */
export function shortReference(value: string): string {
  try {
    const url = new URL(value);
    const path = url.pathname.replace(/\/+$/, "");
    const host = url.hostname.replace(/^www\./, "");
    return path.length > 1 ? `${host}${path.length > 24 ? `${path.slice(0, 24)}…` : path}` : host;
  } catch {
    return value.length > 32 ? `${value.slice(0, 32)}…` : value;
  }
}

export function nextStatus(status: ContentStatus): ContentStatus {
  const index = CONTENT_PIPELINE.indexOf(status);
  return index >= 0 && index < CONTENT_PIPELINE.length - 1
    ? CONTENT_PIPELINE[index + 1]
    : status;
}

export function previousStatus(status: ContentStatus): ContentStatus {
  const index = CONTENT_PIPELINE.indexOf(status);
  return index > 0 ? CONTENT_PIPELINE[index - 1] : status;
}

function sanitizeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

/**
 * Una fecha sólo si es "YYYY-MM-DD" y además existe.
 *
 * Aceptar cualquier cosa que `new Date` entienda es peor que rechazarla: "5/9/2026" pasa,
 * se guarda tal cual y Postgres la lee como 9 de mayo, así que la pieza aparece en un día
 * que nadie eligió. Y el 30 de febrero hay que descartarlo comparando contra la fecha que
 * se construye, porque el mes desborda al 2 de marzo en silencio.
 */
/** La misma validación de fecha, para quien la necesite desde afuera del formulario. */
export function sanitizeTargetDate(value: unknown): string | null {
  return sanitizeDate(value);
}

function sanitizeDate(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  const existe =
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day;

  return existe ? value : null;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null) return {};
  return value as Record<string, unknown>;
}
