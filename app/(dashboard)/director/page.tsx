import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DirectorScreen } from "@/components/director/director-screen";
import { AppHeader } from "@/components/shell/app-header";
import { getAccountContext } from "@/lib/data/account-context";
import { listDirectorChats } from "@/lib/data/director-chats";

export const metadata: Metadata = { title: "Director · Zenovi" };

export default async function DirectorPage() {
  const account = await getAccountContext();
  if (!account?.workspace) redirect("/login");

  return (
    <>
      <AppHeader />
      <DirectorScreen chatId={null} initialMessages={[]} chats={await listDirectorChats(account.workspace.id)} />
    </>
  );
}
