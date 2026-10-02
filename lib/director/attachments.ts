import "server-only";

import sharp from "sharp";
import type { FileUIPart, UIMessage } from "ai";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ACCEPTED_ATTACHMENT_TYPES,
  attachmentIdFromUrl,
  attachmentMediaType,
  attachmentPath,
  attachmentUrl,
  MAX_ATTACHMENT_BYTES,
} from "./attachment-refs";

const BUCKET = "director-attachments";
/**
 * Más grande que esto Claude achica la imagen igual y cobra lo mismo: se guarda ya achicada.
 * Una captura de pantalla de un celular queda en unos 1.600 tokens.
 */
const MAX_IMAGE_SIDE = 1568;
const WEBP_QUALITY = 82;

export type StoredAttachment = { id: string; url: string; mediaType: string; filename: string };

/**
 * Guarda un adjunto. Las imágenes se vuelven a codificar (WebP, sin metadatos, a lo sumo
 * 1568 px); un PDF se acepta sólo si de verdad empieza como PDF. El tipo que declara el
 * navegador no alcanza para confiar en el archivo.
 */
export async function storeAttachment(workspaceId: string, userId: string, file: File): Promise<StoredAttachment | { error: string }> {
  if (!(ACCEPTED_ATTACHMENT_TYPES as readonly string[]).includes(file.type)) {
    return { error: "Por ahora se pueden adjuntar imágenes y PDF." };
  }
  if (file.size === 0 || file.size > MAX_ATTACHMENT_BYTES) {
    return { error: "Ese archivo pesa más de 4 MB. Probá con uno más liviano." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const prepared = file.type === "application/pdf" ? preparePdf(bytes) : await prepareImage(bytes);
  if (!prepared) return { error: "No pudimos leer ese archivo." };

  const id = `${crypto.randomUUID()}.${prepared.extension}`;
  const { error } = await createAdminClient()
    .storage.from(BUCKET)
    .upload(attachmentPath(workspaceId, userId, id), prepared.bytes, { contentType: prepared.contentType });
  if (error) {
    console.error(JSON.stringify({ event: "director_attachment", error: "upload_failed", detail: error.message }));
    return { error: "No pudimos guardar el archivo. Probá de nuevo." };
  }

  return { id, url: attachmentUrl(id), mediaType: prepared.contentType, filename: cleanFilename(file.name) };
}

export async function readAttachment(workspaceId: string, userId: string, id: string) {
  const { data, error } = await createAdminClient().storage.from(BUCKET).download(attachmentPath(workspaceId, userId, id));
  if (error || !data) return null;
  return new Uint8Array(await data.arrayBuffer());
}

/**
 * Antes de mandar la conversación al modelo, cada adjunto propio pasa de dirección a su
 * contenido. Uno que ya no existe se reemplaza por un aviso: el chat sigue andando.
 */
export async function inlineAttachments(messages: UIMessage[], workspaceId: string, userId: string): Promise<UIMessage[]> {
  return Promise.all(
    messages.map(async (message) => {
      if (!message.parts.some((part) => part.type === "file")) return message;
      const parts = await Promise.all(
        message.parts.map(async (part) => {
          if (part.type !== "file") return part;
          const id = attachmentIdFromUrl(part.url);
          const bytes = id ? await readAttachment(workspaceId, userId, id) : null;
          if (!id || !bytes) return { type: "text" as const, text: `[El creador había adjuntado «${part.filename ?? "un archivo"}», que ya no está disponible.]` };
          const mediaType = attachmentMediaType(id);
          return { ...part, mediaType, url: `data:${mediaType};base64,${Buffer.from(bytes).toString("base64")}` } satisfies FileUIPart;
        }),
      );
      return { ...message, parts };
    }),
  );
}

/** Al borrar un chat se borran sus adjuntos: no queda nada guardado que nadie pueda ver. */
export async function removeAttachments(workspaceId: string, userId: string, messages: readonly { parts: unknown }[]) {
  const ids = messages.flatMap((message) =>
    Array.isArray(message.parts)
      ? message.parts.flatMap((part: { type?: unknown; url?: unknown }) => (part?.type === "file" ? [attachmentIdFromUrl(part.url)] : []))
      : [],
  ).filter((id): id is string => id !== null);
  if (ids.length === 0) return;
  const { error } = await createAdminClient().storage.from(BUCKET).remove(ids.map((id) => attachmentPath(workspaceId, userId, id)));
  if (error) console.error(JSON.stringify({ event: "director_attachment", error: "remove_failed", detail: error.message }));
}

async function prepareImage(bytes: Uint8Array) {
  try {
    const webp = await sharp(bytes, { animated: false })
      .rotate()
      .resize({ width: MAX_IMAGE_SIDE, height: MAX_IMAGE_SIDE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
    return { bytes: webp, contentType: "image/webp", extension: "webp" };
  } catch {
    return null;
  }
}

function preparePdf(bytes: Uint8Array) {
  const header = new TextDecoder().decode(bytes.subarray(0, 5));
  return header === "%PDF-" ? { bytes, contentType: "application/pdf", extension: "pdf" } : null;
}

function cleanFilename(name: string) {
  const clean = name.replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 120);
  return clean || "archivo";
}
