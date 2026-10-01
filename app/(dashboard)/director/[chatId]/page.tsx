import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DirectorScreen } from "@/components/director/director-screen";
import { AppHeader } from "@/components/shell/app-header";
import { getAccountContext } from "@/lib/data/account-context";
import { listDirectorChats, loadDirectorChat } from "@/lib/data/director-chats";

export const metadata: Metadata = { title: "Director · Zenovi" };

export default async function DirectorChatPage({ params }: { params: Promise<{ chatId: string }> }) {
  const account = await getAccountContext();
  if (!account?.workspace) redirect("/login");

  const { chatId } = await params;
  const [chat, chats] = await Promise.all([loadDirectorChat(chatId), listDirectorChats(account.workspace.id)]);
  if (!chat) notFound();

  return (
    <>
      <AppHeader />
      {/* La clave reinicia la conversación al cambiar de chat desde la lista. */}
      <DirectorScreen key={chat.id} chatId={chat.id} initialMessages={chat.messages} chats={chats} />
    </>
  );
}
