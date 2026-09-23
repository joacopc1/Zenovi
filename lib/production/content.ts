export const CONTENT_STATUSES = ["idea", "guion", "produccion", "publicada"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const CONTENT_FORMATS = ["reel", "story", "post"] as const;
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

export const FORMAT_LABELS: Record<ContentFormat, string> = {
  reel: "Reel",
  story: "Story",
  post: "Post",
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

function sanitizeDate(value: unknown): string | null {
  if (typeof value !== "string" || value === "") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : value.slice(0, 10);
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null) return {};
  return value as Record<string, unknown>;
}
