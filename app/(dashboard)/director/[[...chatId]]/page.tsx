import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DirectorScreen } from "@/components/director/director-screen";
import { AppHeader } from "@/components/shell/app-header";
import { measureBrandDna } from "@/lib/brand/dna";
import type { DirectorPieceOption } from "@/app/(dashboard)/director/actions";
import { ideaPrompt, pieceHref, pieceLabel } from "@/lib/director/account-snapshots";
import { getAccountContext } from "@/lib/data/account-context";
import { getInstagramContentLibrary } from "@/lib/data/instagram-content";
import { getContentItems } from "@/lib/data/production";
import { getBrandDna } from "@/lib/data/brand-dna";
import { listDirectorChats, loadDirectorChat } from "@/lib/data/director-chats";

export const metadata: Metadata = { title: "Director · Zenovi" };

/**
 * `/director` y `/director/<id>` son la misma página: al mandar el primer mensaje sólo
 * cambia la dirección y se refresca una vez, sin navegar a otra página a mitad de camino
 * (eso dejaba la lista de chats desactualizada).
 */
export default async function DirectorPage({
  params,
  searchParams,
}: {
  params: Promise<{ chatId?: string[] }>;
  /**
   * Desde una pieza (`pieza`), una tarjeta de Producción (`idea`) o una pregunta sugerida en
   * el Inicio (`pregunta`): el chat nuevo arranca con eso cargado en la caja, sin mandarlo.
   */
  searchParams: Promise<{ pieza?: string; idea?: string; pregunta?: string }>;
}) {
  const account = await getAccountContext();
  if (!account?.workspace) redirect("/login");

  const { chatId: segments } = await params;
  if (segments && segments.length > 1) notFound();
  const requestedId = segments?.[0] ?? null;

  const [chat, chats, dna] = await Promise.all([
    requestedId ? loadDirectorChat(requestedId) : null,
    listDirectorChats(account.workspace.id),
    getBrandDna(account.workspace.id),
  ]);
  const completeness = measureBrandDna(dna);
  if (requestedId && !chat) notFound();

  // Un chat nuevo nace con su id desde el servidor; existe en la base recién con el primer mensaje.
  const chatId = chat?.id ?? crypto.randomUUID();
  const { pieza, idea, pregunta } = await searchParams;
  const [initialPiece, ideaText] = chat ? [null, ""] : await Promise.all([
    findPiece(account.workspace.id, pieza),
    findIdeaPrompt(account.workspace.id, idea),
  ]);
  // La pregunta sólo se escribe en la caja: la persona la lee y decide si la manda.
  const initialText = ideaText || (chat ? "" : suggestedQuestion(pregunta));

  return (
    <>
      <AppHeader />
      <DirectorScreen
        key={chatId}
        chatId={chatId}
        isNew={!chat}
        initialMessages={chat?.messages ?? []}
        initialRatings={chat?.ratings ?? {}}
        brandDnaShare={completeness.total > 0 ? completeness.completed / completeness.total : 0}
        initialPiece={initialPiece}
        initialText={initialText}
        chats={chats}
      />
    </>
  );
}

/** La pieza se busca dentro de la biblioteca propia: un id ajeno no encuentra nada. */
async function findPiece(workspaceId: string, id: string | undefined): Promise<DirectorPieceOption | null> {
  if (!id) return null;
  const library = await getInstagramContentLibrary(workspaceId);
  const item = library?.items.find((candidate) => candidate.id === id);
  if (!item) return null;
  return {
    id: item.id,
    label: pieceLabel(item),
    href: pieceHref(item),
    caption: item.caption ? item.caption.slice(0, 90) : null,
    thumbnailUrl: item.thumbnailUrl ?? item.mediaUrl,
  };
}

/** La idea se busca entre las tarjetas del workspace propio, igual que en Producción. */
async function findIdeaPrompt(workspaceId: string, id: string | undefined) {
  if (!id) return "";
  const item = (await getContentItems(workspaceId)).find((candidate) => candidate.id === id);
  return item ? ideaPrompt(item) : "";
}

const MAX_SUGGESTED_QUESTION = 300;

function suggestedQuestion(value: string | undefined) {
  return typeof value === "string" ? value.trim().slice(0, MAX_SUGGESTED_QUESTION) : "";
}
