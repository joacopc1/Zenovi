/**
 * Cómo se nombra un adjunto del Director. El mensaje guarda sólo una dirección propia
 * (/api/director/attachments/<id>), nunca el archivo ni una URL firmada que vence: la
 * dirección se resuelve en el servidor, dentro de la carpeta de quien pide.
 */

export const ATTACHMENT_URL_PREFIX = "/api/director/attachments/";
export const MAX_ATTACHMENTS_PER_MESSAGE = 4;
/** Vercel no acepta cuerpos de más de 4,5 MB: 4 MB por archivo deja margen. */
export const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;

/** Lo que se puede elegir: imágenes comunes y PDF. Las imágenes se guardan como WebP. */
export const ACCEPTED_ATTACHMENT_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"] as const;

const ATTACHMENT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(webp|pdf)$/i;
const MEDIA_TYPES = { webp: "image/webp", pdf: "application/pdf" } as const;

export function isAttachmentId(value: unknown): value is string {
  return typeof value === "string" && ATTACHMENT_ID.test(value);
}

export function attachmentUrl(id: string) {
  return `${ATTACHMENT_URL_PREFIX}${id}`;
}

/** El id de una dirección propia; null para cualquier otra cosa (una URL externa, un data:). */
export function attachmentIdFromUrl(url: unknown) {
  if (typeof url !== "string" || !url.startsWith(ATTACHMENT_URL_PREFIX)) return null;
  const id = url.slice(ATTACHMENT_URL_PREFIX.length);
  return isAttachmentId(id) ? id : null;
}

/** La carpeta sale de la sesión, no del id: nadie llega al archivo de otra persona. */
export function attachmentPath(workspaceId: string, userId: string, id: string) {
  return `${workspaceId}/${userId}/${id}`;
}

export function attachmentMediaType(id: string) {
  return MEDIA_TYPES[id.slice(id.lastIndexOf(".") + 1).toLowerCase() as keyof typeof MEDIA_TYPES];
}
