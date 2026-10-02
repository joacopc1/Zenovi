import { getAccountContext } from "@/lib/data/account-context";
import { storeAttachment } from "@/lib/director/attachments";
import { RATE_LIMITED_MESSAGE, takeRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

/** Sube un adjunto para el próximo mensaje al Director. Devuelve la dirección propia. */
export async function POST(request: Request) {
  const account = await getAccountContext();
  if (!account?.workspace) return Response.json({ error: "Tu sesión venció. Volvé a iniciar sesión." }, { status: 401 });

  if (!(await takeRateLimit("director_attachment", account.userId))) {
    return Response.json({ error: RATE_LIMITED_MESSAGE }, { status: 429 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No llegó ningún archivo." }, { status: 400 });

  const stored = await storeAttachment(account.workspace.id, account.userId, file);
  if ("error" in stored) return Response.json(stored, { status: 400 });
  return Response.json(stored);
}
