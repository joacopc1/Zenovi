import { getAccountContext } from "@/lib/data/account-context";
import { attachmentMediaType, isAttachmentId } from "@/lib/director/attachment-refs";
import { readAttachment } from "@/lib/director/attachments";

export const runtime = "nodejs";

/**
 * Muestra un adjunto en el chat. Se busca en la carpeta de la sesión: con el id de un
 * archivo ajeno no se encuentra nada.
 */
export async function GET(_request: Request, context: RouteContext<"/api/director/attachments/[id]">) {
  const { id } = await context.params;
  const account = await getAccountContext();
  if (!account?.workspace || !isAttachmentId(id)) return new Response(null, { status: 404 });

  const bytes = await readAttachment(account.workspace.id, account.userId, id);
  if (!bytes) return new Response(null, { status: 404 });
  return new Response(bytes, {
    headers: {
      "Content-Type": attachmentMediaType(id),
      // El archivo no cambia nunca: el navegador lo guarda, pero sólo para esta persona.
      "Cache-Control": "private, max-age=86400, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    },
  });
}
