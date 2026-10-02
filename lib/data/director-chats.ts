import "server-only";

import type { UIMessage } from "ai";
import { createClient } from "@/lib/supabase/server";

export type DirectorChatSummary = { id: string; title: string | null; updatedAt: string; archived: boolean };

/**
 * Los chats de la persona en este workspace, del más reciente al más viejo, archivados
 * incluidos (la lista los muestra aparte). RLS deja ver sólo los propios.
 */
export async function listDirectorChats(workspaceId: string): Promise<DirectorChatSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("director_chats")
    .select("id, title, updated_at, archived_at")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) throw new Error("No pudimos cargar tus chats.");
  return (data ?? []).map((chat) => ({
    id: chat.id,
    title: chat.title,
    updatedAt: chat.updated_at,
    archived: chat.archived_at !== null,
  }));
}

/** Los mensajes de un chat propio, en orden. Null si el chat no existe o no es de quien pide. */
export async function loadDirectorChat(chatId: string) {
  const supabase = await createClient();
  const [{ data: chat }, { data: messages, error }] = await Promise.all([
    supabase.from("director_chats").select("id, title").eq("id", chatId).maybeSingle(),
    supabase.from("director_messages").select("id, role, parts").eq("chat_id", chatId).order("created_at"),
  ]);

  if (!chat || error) return null;
  const messageIds = (messages ?? []).map((message) => message.id as string);
  const { data: ratings } = messageIds.length
    ? await supabase.from("director_message_feedback").select("message_id, rating").in("message_id", messageIds)
    : { data: [] };

  return {
    id: chat.id as string,
    title: chat.title as string | null,
    // Si la tabla todavía no existe o falla la lectura, el chat abre igual, sin calificaciones.
    ratings: Object.fromEntries((ratings ?? []).map((row) => [row.message_id, row.rating])) as Record<string, "up" | "down">,
    messages: (messages ?? []).map((message) => ({
      id: message.id,
      role: message.role,
      parts: message.parts,
    })) as UIMessage[],
  };
}
