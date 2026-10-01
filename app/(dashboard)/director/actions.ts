"use server";

import { revalidatePath } from "next/cache";
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

export async function deleteDirectorChat(chatId: string) {
  if (!UUID.test(chatId)) return;
  const supabase = await createClient();
  await supabase.from("director_chats").delete().eq("id", chatId);
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
