"use client";

import { useRef, useState, useTransition } from "react";
import { Camera } from "lucide-react";
import { PersonAvatar } from "@/components/shell/person-avatar";
import { updateAvatar, updateDisplayName } from "./profile-actions";

const AVATAR_SIZE = 256;

/**
 * El perfil en Ajustes: se ve como ficha y "Editar perfil" lo pasa a un formulario con la
 * foto y el nombre. La foto se recorta al centro y se achica antes de subirla.
 */
export function ProfileEditor({ name, email, avatarUrl, planLabel }: { name: string; email: string | null; avatarUrl: string | null; planLabel: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function saveName() {
    setError(null);
    startTransition(async () => {
      const result = await updateDisplayName(draft);
      if (result.error) setError(result.error);
      else setEditing(false);
    });
  }

  function chooseAvatar(file: File | undefined) {
    if (!file) return;
    setError(null);
    startTransition(async () => {
      const resized = await squareWebp(file).catch(() => null);
      if (!resized) {
        setError("No pudimos leer esa imagen. Probá con otra.");
        return;
      }
      const form = new FormData();
      form.set("avatar", resized, "avatar.webp");
      const result = await updateAvatar(form);
      if (result.error) setError(result.error);
    });
    if (fileRef.current) fileRef.current.value = "";
  }

  function cancel() {
    setDraft(name);
    setError(null);
    setEditing(false);
  }

  const fileInput = (
    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => chooseAvatar(event.target.files?.[0])} />
  );

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-4">
        <PersonAvatar src={avatarUrl} size={64} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-medium text-ink">{name}</p>
          {email ? <p className="truncate text-sm text-graphite">{email}</p> : null}
          <span className="mt-1.5 inline-block rounded-md bg-control px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-graphite">{planLabel}</span>
        </div>
        <button type="button" onClick={() => setEditing(true)} className="inline-flex min-h-9 items-center rounded-control border border-mist px-3 text-[13px] font-medium text-ink hover:bg-canvas">
          Editar perfil
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        saveName();
      }}
      className="space-y-4"
    >
      <div className="flex items-center gap-4">
        <PersonAvatar src={avatarUrl} size={64} />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => fileRef.current?.click()} disabled={pending} className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-mist px-3 text-[13px] font-medium text-ink hover:bg-canvas disabled:opacity-50">
            <Camera aria-hidden="true" className="size-4" strokeWidth={1.75} />
            Cambiar foto
          </button>
          {fileInput}
        </div>
      </div>
      <label className="block">
        <span className="font-support block text-xs text-graphite">Nombre</span>
        <input
          autoFocus
          value={draft}
          maxLength={80}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") cancel();
          }}
          className="mt-1 h-9 w-full max-w-sm rounded-control border border-mist-strong bg-paper px-3 text-sm text-ink outline-none focus:border-ink"
        />
      </label>
      {error ? <p className="text-[12px] text-danger">{error}</p> : null}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="inline-flex min-h-9 items-center rounded-control bg-ink px-4 text-[13px] font-semibold text-white hover:bg-ink/85 disabled:opacity-50">
          Guardar
        </button>
        <button type="button" onClick={cancel} className="inline-flex min-h-9 items-center rounded-control border border-mist px-4 text-[13px] font-medium text-ink hover:bg-canvas">
          Cancelar
        </button>
      </div>
    </form>
  );
}

/** Recorta la imagen al cuadrado del centro y la pasa a WebP de 256 px. */
async function squareWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("no_canvas");
  context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
  if (!blob) throw new Error("no_blob");
  return blob;
}
