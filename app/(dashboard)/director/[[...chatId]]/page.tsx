import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DirectorScreen } from "@/components/director/director-screen";
import { AppHeader } from "@/components/shell/app-header";
import { getAccountContext } from "@/lib/data/account-context";
import { listDirectorChats, loadDirectorChat } from "@/lib/data/director-chats";

export const metadata: Metadata = { title: "Director · Zenovi" };

/**
 * `/director` y `/director/<id>` son la misma página: al mandar el primer mensaje sólo
 * cambia la dirección y se refresca una vez, sin navegar a otra página a mitad de camino
 * (eso dejaba la lista de chats desactualizada).
 */
export default async function DirectorPage({ params }: { params: Promise<{ chatId?: string[] }> }) {
  const account = await getAccountContext();
  if (!account?.workspace) redirect("/login");

  const { chatId: segments } = await params;
  if (segments && segments.length > 1) notFound();
  const requestedId = segments?.[0] ?? null;

  const [chat, chats] = await Promise.all([
    requestedId ? loadDirectorChat(requestedId) : null,
    listDirectorChats(account.workspace.id),
  ]);
  if (requestedId && !chat) notFound();

  // Un chat nuevo nace con su id desde el servidor; existe en la base recién con el primer mensaje.
  const chatId = chat?.id ?? crypto.randomUUID();

  return (
    <>
      <AppHeader />
      <DirectorScreen key={chatId} chatId={chatId} isNew={!chat} initialMessages={chat?.messages ?? []} chats={chats} />
    </>
  );
}
