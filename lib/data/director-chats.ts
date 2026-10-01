import "server-only";

import type { UIMessage } from "ai";
import { createClient } from "@/lib/supabase/server";

export type DirectorChatSummary = { id: string; title: string | null; updatedAt: string };

/** Los chats de la persona en este workspace, del más reciente al más viejo. RLS deja ver sólo los propios. */
export async function listDirectorChats(workspaceId: string): Promise<DirectorChatSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("director_chats")
    .select("id, title, updated_at")
    .eq("workspace_id", workspaceId)
    .is("archived_at", null)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) throw new Error("No pudimos cargar tus chats.");
  return (data ?? []).map((chat) => ({ id: chat.id, title: chat.title, updatedAt: chat.updated_at }));
}

/** Los mensajes de un chat propio, en orden. Null si el chat no existe o no es de quien pide. */
export async function loadDirectorChat(chatId: string) {
  const supabase = await createClient();
  const [{ data: chat }, { data: messages, error }] = await Promise.all([
    supabase.from("director_chats").select("id, title").eq("id", chatId).maybeSingle(),
    supabase.from("director_messages").select("id, role, parts").eq("chat_id", chatId).order("created_at"),
  ]);

  if (!chat || error) return null;
  return {
    id: chat.id as string,
    title: chat.title as string | null,
    messages: (messages ?? []).map((message) => ({
      id: message.id,
      role: message.role,
      parts: message.parts,
    })) as UIMessage[],
  };
}
