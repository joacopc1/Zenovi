"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FileUIPart } from "ai";
import { FileText, LoaderIcon, X } from "lucide-react";
import {
  ACCEPTED_ATTACHMENT_TYPES,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS_PER_MESSAGE,
} from "@/lib/director/attachment-refs";

type PendingAttachment = {
  key: string;
  name: string;
  isImage: boolean;
  /** Vista previa local mientras sube; después se sigue usando la misma. */
  preview: string | null;
  part: FileUIPart | null;
};

export const ATTACHMENT_ACCEPT = ACCEPTED_ATTACHMENT_TYPES.join(",");

/**
 * Los archivos del próximo mensaje. Cada uno sube apenas se elige, así al mandar ya está
 * guardado; mientras sube, enviar espera.
 */
export function useAttachments() {
  const [items, setItems] = useState<PendingAttachment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const previews = useRef(new Set<string>());

  useEffect(() => {
    const urls = previews.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const add = useCallback(
    (files: readonly File[]) => {
      setError(null);
      const room = MAX_ATTACHMENTS_PER_MESSAGE - items.length;
      if (files.length > room) setError(`Podés adjuntar hasta ${MAX_ATTACHMENTS_PER_MESSAGE} archivos por mensaje.`);
      for (const file of files.slice(0, Math.max(room, 0))) {
        if (!(ACCEPTED_ATTACHMENT_TYPES as readonly string[]).includes(file.type)) {
          setError("Por ahora se pueden adjuntar imágenes y PDF.");
          continue;
        }
        if (file.size > MAX_ATTACHMENT_BYTES) {
          setError("Ese archivo pesa más de 4 MB. Probá con uno más liviano.");
          continue;
        }
        const key = crypto.randomUUID();
        const isImage = file.type.startsWith("image/");
        const preview = isImage ? URL.createObjectURL(file) : null;
        if (preview) previews.current.add(preview);
        setItems((current) => [...current, { key, name: file.name, isImage, preview, part: null }]);
        void upload(file).then((result) => {
          if ("error" in result) {
            setError(result.error);
            setItems((current) => current.filter((item) => item.key !== key));
            return;
          }
          setItems((current) => current.map((item) => (item.key === key ? { ...item, part: result } : item)));
        });
      }
    },
    [items.length],
  );

  return {
    items,
    error,
    uploading: items.some((item) => item.part === null),
    parts: items.flatMap((item) => (item.part ? [item.part] : [])),
    add,
    remove: (key: string) => setItems((current) => current.filter((item) => item.key !== key)),
    dismissError: () => setError(null),
    clear: () => {
      setItems([]);
      setError(null);
    },
  };
}

async function upload(file: File): Promise<FileUIPart | { error: string }> {
  const form = new FormData();
  form.append("file", file);
  try {
    const response = await fetch("/api/director/attachments", { method: "POST", body: form });
    const body = await response.json().catch(() => null);
    if (!response.ok || !body?.url) return { error: body?.error ?? "No pudimos subir el archivo." };
    return { type: "file", mediaType: body.mediaType, url: body.url, filename: body.filename };
  } catch {
    return { error: "No pudimos subir el archivo. Revisá la conexión." };
  }
}

/** Los archivos elegidos, arriba del texto: miniatura o nombre, y una cruz para sacarlos. */
export function PendingAttachments({ items, onRemove }: { items: PendingAttachment[]; onRemove: (key: string) => void }) {
  if (items.length === 0) return null;
  return (
    <div className="mb-1.5 ml-1.5 mt-0.5 flex flex-wrap gap-2">
      {items.map((item) => (
        <div key={item.key} className="relative">
          {item.isImage && item.preview ? (
            <span className="relative block size-14 overflow-hidden rounded-xl border border-mist bg-canvas">
              <Image src={item.preview} alt={item.name} fill sizes="56px" unoptimized className="object-cover" />
            </span>
          ) : (
            <span className="flex h-14 max-w-48 items-center gap-2 rounded-xl border border-mist bg-canvas pl-2.5 pr-7">
              <FileText aria-hidden="true" className="size-5 shrink-0 text-ink" strokeWidth={1.6} />
              <span className="truncate text-[12px] font-medium text-ink">{item.name}</span>
            </span>
          )}
          {item.part === null ? (
            <span className="absolute inset-0 grid place-items-center rounded-xl bg-paper/60" role="status" aria-label={`Subiendo ${item.name}`}>
              <LoaderIcon className="size-4 animate-spin text-ink" strokeWidth={2} />
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => onRemove(item.key)}
            aria-label={`Quitar ${item.name}`}
            className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-ink text-paper hover:bg-ink/85"
          >
            <X className="size-3" strokeWidth={2.2} />
          </button>
        </div>
      ))}
    </div>
  );
}

/** Un adjunto ya enviado, en el mensaje del creador: la imagen se abre grande; el PDF, aparte. */
export function SentAttachment({ part }: { part: FileUIPart }) {
  const name = part.filename ?? "archivo";
  if (part.mediaType.startsWith("image/")) {
    return (
      <a href={part.url} target="_blank" rel="noopener noreferrer" className="relative block h-40 w-32 overflow-hidden rounded-2xl border border-mist bg-canvas">
        <Image src={part.url} alt={name} fill sizes="128px" unoptimized className="object-cover" />
      </a>
    );
  }
  return (
    <a
      href={part.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex max-w-60 items-center gap-2 rounded-2xl border border-mist bg-paper px-3 py-2.5 hover:bg-canvas"
    >
      <FileText aria-hidden="true" className="size-5 shrink-0 text-ink" strokeWidth={1.6} />
      <span className="truncate text-[13px] font-medium text-ink">{name}</span>
    </a>
  );
}
