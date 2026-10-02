"use server";

import { revalidatePath } from "next/cache";
import { sanitizeContentItem } from "@/lib/production/content";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProposedIdea } from "@/lib/director/idea-tool";
import { getAccountContext } from "@/lib/data/account-context";
import { getInstagramContentLibrary } from "@/lib/data/instagram-content";
import { pieceHref, pieceLabel, validTimeZone } from "@/lib/director/account-snapshots";
import { removeAttachments } from "@/lib/director/attachments";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** RLS limita ambas acciones a los chats propios: un id ajeno no afecta ninguna fila. */
export async function renameDirectorChat(chatId: string, title: string) {
  const clean = title.trim().slice(0, 120);
  if (!UUID.test(chatId) || !clean) return;
  const supabase = await createClient();
  await supabase.from("director_chats").update({ title: clean }).eq("id", chatId);
  revalidatePath("/director", "layout");
}

/** Archivar saca el chat de Recientes sin borrarlo; se puede volver a traer. */
export async function archiveDirectorChat(chatId: string, archived: boolean) {
  if (!UUID.test(chatId) || typeof archived !== "boolean") return;
  const supabase = await createClient();
  await supabase.from("director_chats").update({ archived_at: archived ? new Date().toISOString() : null }).eq("id", chatId);
  revalidatePath("/director", "layout");
}

export async function deleteDirectorChat(chatId: string) {
  if (!UUID.test(chatId)) return;
  const account = await getAccountContext();
  if (!account?.workspace) return;
  const supabase = await createClient();
  // Los adjuntos se leen antes de borrar: después, los mensajes ya no existen.
  const { data: messages } = await supabase.from("director_messages").select("parts").eq("chat_id", chatId);
  const { error } = await supabase.from("director_chats").delete().eq("id", chatId);
  if (!error) await removeAttachments(account.workspace.id, account.userId, messages ?? []);
  revalidatePath("/director", "layout");
}

export type AnswerRating = "up" | "down";

/** Me sirvió / no me sirvió. Volver a tocar la misma la quita. RLS limita a respuestas de chats propios. */
export async function rateDirectorAnswer(messageId: string, rating: AnswerRating | null) {
  if (typeof messageId !== "string" || messageId.length > 100) return;
  if (rating !== null && rating !== "up" && rating !== "down") return;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;

  if (rating === null) {
    await supabase.from("director_message_feedback").delete().eq("message_id", messageId).eq("user_id", auth.user.id);
    return;
  }
  await supabase
    .from("director_message_feedback")
    .upsert({ message_id: messageId, user_id: auth.user.id, rating }, { onConflict: "message_id,user_id" });
}

export type DirectorPieceOption = {
  id: string;
  label: string;
  href: string;
  caption: string | null;
  thumbnailUrl: string | null;
};

/** Las piezas recientes de la cuenta, para adjuntarle una al Director. Se cargan con la sesión de quien pide. */
export async function listDirectorPieces(timeZone: string): Promise<DirectorPieceOption[]> {
  const zone = validTimeZone(timeZone);
  const account = await getAccountContext();
  if (!account?.workspace) return [];
  const library = await getInstagramContentLibrary(account.workspace.id);
  return (library?.items ?? []).slice(0, 60).map((item) => ({
    id: item.id,
    label: pieceLabel(item, zone),
    href: pieceHref(item),
    caption: item.caption ? item.caption.slice(0, 90) : null,
    thumbnailUrl: item.thumbnailUrl ?? item.mediaUrl,
  }));
}

type IdeaPart = { type: string; toolCallId?: string; input?: ProposedIdea; output?: { propuesta?: boolean; guardada?: string } };

/**
 * Guarda en Producción una idea que propuso el Director. La idea se relee del mensaje
 * guardado (que RLS sólo deja leer al dueño del chat), no de lo que mande el navegador, y
 * el mensaje queda marcado con la tarjeta creada: reabrir el chat no permite duplicarla.
 */
export async function saveDirectorIdea(messageId: string, toolCallId: string): Promise<{ ok: true; itemId: string } | { ok: false; message: string }> {
  if (typeof messageId !== "string" || typeof toolCallId !== "string" || messageId.length > 100 || toolCallId.length > 100) {
    return { ok: false, message: "No encontramos esa idea." };
  }
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, message: "Tu sesión venció. Volvé a iniciar sesión." };

  const { data: stored } = await supabase.from("director_messages").select("id, parts").eq("id", messageId).maybeSingle();
  const parts = (stored?.parts ?? []) as IdeaPart[];
  const part = parts.find((candidate) => candidate.type === "tool-proponer_idea" && candidate.toolCallId === toolCallId);
  if (!stored || !part?.input) return { ok: false, message: "No encontramos esa idea." };
  if (part.output?.guardada) return { ok: true, itemId: part.output.guardada };

  const { data: workspace } = await supabase.from("workspaces").select("id").eq("created_by", auth.user.id).maybeSingle();
  if (!workspace) return { ok: false, message: "No encontramos tu workspace." };

  const idea = part.input;
  const draft = sanitizeContentItem({
    title: idea.titulo,
    format: idea.formato,
    contentType: idea.tipo_de_contenido ?? "",
    hook: idea.gancho ?? "",
    development: idea.desarrollo ?? "",
    cta: idea.cta ?? "",
    // Con desarrollo ya escrito, la pieza nace como guion; si no, como idea.
    status: idea.desarrollo?.trim() ? "guion" : "idea",
    source: "director",
  });
  if (!draft.ok) return { ok: false, message: "La idea no tiene título." };

  const value = draft.value;
  const { data: created, error } = await supabase
    .from("content_items")
    .insert({
      workspace_id: workspace.id,
      title: value.title,
      content_type: value.contentType,
      format: value.format,
      status: value.status,
      hook: value.hook,
      development: value.development,
      cta: value.cta,
      source: value.source,
      reference_url: value.referenceUrl,
    })
    .select("id")
    .single();
  if (error || !created) return { ok: false, message: "No pudimos guardar la idea." };

  // El mensaje lo escribe sólo el servidor: se marca la idea como guardada para no duplicarla.
  const updatedParts = parts.map((candidate) =>
    candidate === part ? { ...candidate, output: { ...candidate.output, guardada: created.id as string } } : candidate,
  );
  await createAdminClient().from("director_messages").update({ parts: updatedParts }).eq("id", messageId);

  revalidatePath("/production");
  return { ok: true, itemId: created.id as string };
}
