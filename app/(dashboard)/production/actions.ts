"use server";

import { revalidatePath } from "next/cache";
import {
  isContentStatus,
  nextStatus,
  previousStatus,
  sanitizeContentItem,
  type ContentItemFieldErrors,
  type ContentStatus,
} from "@/lib/production/content";
import { autoLinkPublishedPiece } from "@/lib/data/production-links";
import { createClient } from "@/lib/supabase/server";

export type ContentActionState = {
  status: "idle" | "saved" | "error";
  errors?: ContentItemFieldErrors;
  message?: string;
};

export async function createContentItem(
  _previousState: ContentActionState,
  raw: unknown,
): Promise<ContentActionState> {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return { status: "error", message: "Tu sesión venció. Volvé a iniciar sesión." };
  }

  // Por dueño y no "el primero que venga": el día que una persona tenga dos marcas,
  // `limit(1)` escribiría la idea en cualquiera de las dos.
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id")
    .eq("created_by", authData.user.id)
    .maybeSingle();

  if (workspaceError || !workspace) {
    return { status: "error", message: "No encontramos tu workspace." };
  }

  const result = sanitizeContentItem(raw);
  if (!result.ok) {
    return { status: "error", errors: result.errors };
  }

  const item = result.value;
  const { error } = await supabase.from("content_items").insert({
    workspace_id: workspace.id,
    title: item.title,
    content_type: item.contentType,
    format: item.format,
    status: item.status,
    target_date: item.targetDate,
    reference_url: item.referenceUrl,
    hook: item.hook,
    development: item.development,
    cta: item.cta,
    source: item.source,
  });

  if (error) {
    return { status: "error", message: "No pudimos guardar la idea." };
  }

  revalidatePath("/production");
  return { status: "saved" };
}

export async function moveContentItem(
  _previousState: ContentActionState,
  raw: unknown,
): Promise<ContentActionState> {
  const source = asRecord(raw);
  const id = typeof source.id === "string" ? source.id : "";
  const direction = source.direction === "back" ? "back" : "forward";

  if (!id) {
    return { status: "error", message: "Falta identificar la pieza." };
  }

  const supabase = await createClient();
  const { data: item, error: fetchError } = await supabase
    .from("content_items")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !item) {
    return { status: "error", message: "No encontramos la pieza." };
  }

  const current = item.status as string;
  if (!isContentStatus(current)) {
    return { status: "error", message: "El estado de la pieza no es válido." };
  }

  const next = direction === "back" ? previousStatus(current) : nextStatus(current);

  if (next === current) return { status: "idle" };

  const { error } = await supabase
    .from("content_items")
    .update({ status: next, ...publishFieldsFor(next) })
    .eq("id", id);

  if (error) {
    return { status: "error", message: "No pudimos mover la pieza." };
  }

  if (next === "publicada") await autoLinkPublishedPiece(id);

  revalidatePath("/production");
  return { status: "saved" };
}

export async function moveContentItemToStatus(
  _previousState: ContentActionState,
  raw: unknown,
): Promise<ContentActionState> {
  const source = asRecord(raw);
  const id = typeof source.id === "string" ? source.id : "";
  const status = source.status;

  if (!id) {
    return { status: "error", message: "Falta identificar la pieza." };
  }
  if (!isContentStatus(status)) {
    return { status: "error", message: "El estado destino no es válido." };
  }

  const supabase = await createClient();
  // `neq` deja pasar sólo el cambio real: soltar una pieza en la columna donde ya estaba
  // no puede reescribir su fecha de publicación con la de hoy.
  const { error } = await supabase
    .from("content_items")
    .update({ status, ...publishFieldsFor(status) })
    .eq("id", id)
    .neq("status", status);

  if (error) {
    return { status: "error", message: "No pudimos mover la pieza." };
  }

  if (status === "publicada") await autoLinkPublishedPiece(id);

  revalidatePath("/production");
  return { status: "saved" };
}

/**
 * Lo que implica publicar, y lo que implica dejar de estar publicada.
 *
 * Volver una pieza atrás borra su fecha —si no, el tablero la seguiría contando como algo
 * que salió esta semana cuando en realidad volvió a producción— y también suelta el
 * vínculo con el video. El vínculo afirma "esta pieza *es* esa publicación"; una pieza
 * que está en guión no es ninguna publicación todavía. Y mientras lo conserva, deja ese
 * video reservado: ninguna otra pieza puede reclamarlo, ni siquiera la que de verdad se
 * publicó. Si vuelve a publicarse, se vuelve a reconocer sola.
 */
function publishFieldsFor(status: ContentStatus): {
  published_at: string | null;
  linked_media_id?: null;
} {
  if (status === "publicada") return { published_at: new Date().toISOString() };

  return { published_at: null, linked_media_id: null };
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null) return {};
  return value as Record<string, unknown>;
}

export async function updateContentItem(
  _previousState: ContentActionState,
  raw: unknown,
): Promise<ContentActionState> {
  const source = asRecord(raw);
  const id = typeof source.id === "string" ? source.id : "";

  if (!id) {
    return { status: "error", message: "Falta identificar la pieza." };
  }

  const result = sanitizeContentItem(source);
  if (!result.ok) {
    return { status: "error", errors: result.errors };
  }

  const item = result.value;
  const supabase = await createClient();
  const { error } = await supabase
    .from("content_items")
    .update({
      title: item.title,
      content_type: item.contentType,
      format: item.format,
      target_date: item.targetDate,
      reference_url: item.referenceUrl,
      hook: item.hook,
      development: item.development,
      cta: item.cta,
    })
    .eq("id", id);

  if (error) {
    return { status: "error", message: "No pudimos guardar la pieza." };
  }

  revalidatePath("/production");
  return { status: "saved" };
}

/**
 * Ata una pieza del tablero a la publicación real que terminó siendo.
 *
 * La publicación se busca primero con la sesión de quien pide: la clave foránea sólo
 * garantiza que el id exista en la base, y esa comprobación corre por fuera de RLS, así
 * que sin este paso alguien podría atar su pieza a un Reel de otra cuenta.
 */
export async function linkPublishedMedia(
  _previousState: ContentActionState,
  raw: unknown,
): Promise<ContentActionState> {
  const source = asRecord(raw);
  const id = typeof source.id === "string" ? source.id : "";
  const mediaId = typeof source.mediaId === "string" ? source.mediaId : "";

  if (!id || !mediaId) {
    return { status: "error", message: "Falta identificar la pieza o la publicación." };
  }

  const supabase = await createClient();
  const { data: media, error: mediaError } = await supabase
    .from("instagram_media")
    .select("id")
    .eq("id", mediaId)
    .maybeSingle();

  if (mediaError || !media) {
    return { status: "error", message: "No encontramos esa publicación en tu cuenta." };
  }

  const { error } = await supabase
    .from("content_items")
    .update({ linked_media_id: mediaId })
    .eq("id", id);

  if (error) {
    return { status: "error", message: "No pudimos vincular la publicación." };
  }

  revalidatePath("/production");
  return { status: "saved" };
}

/** Suelta el vínculo cuando el creador se equivocó de publicación. */
export async function unlinkPublishedMedia(
  _previousState: ContentActionState,
  raw: unknown,
): Promise<ContentActionState> {
  const source = asRecord(raw);
  const id = typeof source.id === "string" ? source.id : "";

  if (!id) {
    return { status: "error", message: "Falta identificar la pieza." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("content_items")
    .update({ linked_media_id: null })
    .eq("id", id);

  if (error) {
    return { status: "error", message: "No pudimos soltar el vínculo." };
  }

  revalidatePath("/production");
  return { status: "saved" };
}
