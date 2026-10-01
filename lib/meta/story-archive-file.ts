import sharp from "sharp";

const VIDEO_EXTENSIONS: Record<string, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
};
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Calidad que no se distingue en una Historia vertical y pesa del orden de un tercio de un JPEG. */
const WEBP_QUALITY = 80;

/**
 * Lo que se guarda de cada archivo: las imágenes pasan a WebP a su tamaño original; los
 * videos se guardan tal cual porque recomprimirlos en el servidor cuesta más de lo que ahorra
 * y de todos modos se borran a los 30 días.
 */
export async function toArchiveFile(contentType: string, bytes: Uint8Array) {
  if (IMAGE_TYPES.has(contentType)) {
    const webp = await sharp(bytes).rotate().webp({ quality: WEBP_QUALITY }).toBuffer();
    return { bytes: webp, contentType: "image/webp", extension: "webp" };
  }

  const extension = VIDEO_EXTENSIONS[contentType];
  if (!extension) throw new Error("archive_type_unsupported");
  return { bytes, contentType, extension };
}

/** Los videos ocupan casi todo el espacio: se guardan 30 días, suficiente para analizar la secuencia. */
export const ARCHIVED_VIDEO_DAYS = 30;

export function archivedVideoCutoff(now: Date) {
  return new Date(now.getTime() - ARCHIVED_VIDEO_DAYS * 24 * 60 * 60 * 1000);
}

export function isArchivedVideo(path: string) {
  return Object.values(VIDEO_EXTENSIONS).some((extension) => path.endsWith(`.${extension}`));
}

/**
 * Tope de videos guardados por cuenta en los 30 días que se conservan: unos cinco por día,
 * el uso normal, y como mucho del orden de 900 MB por cuenta. Pasado el tope se guarda
 * sólo la portada, para que nadie convierta el almacenamiento en un costo sin techo
 * (Instagram permite subir hasta 100 Historias por día).
 */
export const ARCHIVED_VIDEOS_PER_ACCOUNT = 150;

/**
 * Cuántas Historias vivas se refrescan por cuenta en cada corrida horaria, empezando por
 * las más cercanas a vencer, que son las que necesitan su última lectura. Son dos pedidos
 * a Meta por Historia: así una cuenta con 100 Historias vivas no agota su límite por hora.
 */
export const STORIES_REFRESHED_PER_RUN = 40;

export function planStoryRefresh<T extends { timestamp: string }>(stories: readonly T[], limit = STORIES_REFRESHED_PER_RUN) {
  return stories.toSorted((left, right) => Date.parse(left.timestamp) - Date.parse(right.timestamp)).slice(0, limit);
}
