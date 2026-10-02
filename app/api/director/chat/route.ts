import { anthropic } from "@ai-sdk/anthropic";
import {
  convertToModelMessages,
  generateId,
  generateText,
  jsonSchema,
  stepCountIs,
  streamText,
  tool,
  validateUIMessages,
  type SystemModelMessage,
  type ToolSet,
  type UIMessage,
} from "ai";
import { recordAiUsage } from "@/lib/credits/record-usage";
import { DIRECTOR_MODEL, UTILITY_MODEL } from "@/lib/ai/models";
import { getAccountContext } from "@/lib/data/account-context";
import { getBrandDna } from "@/lib/data/brand-dna";
import { getCreditBalance } from "@/lib/data/credit-balance";
import { buildAccountTools } from "@/lib/director/account-tools";
import { DIRECTOR_GUIDES } from "@/lib/director/guides";
import { readDirectorGuide } from "@/lib/director/guides/read-guide";
import { validTimeZone } from "@/lib/director/account-snapshots";
import { hasAnswerText, historyForModel } from "@/lib/director/history";
import { buildDirectorSystem } from "@/lib/director/prompt";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_MESSAGE_CHARACTERS = 8000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
/** La capacitación y el ADN se repiten en cada mensaje: en caché cuestan un 10 %. */
const CACHE = { anthropic: { cacheControl: { type: "ephemeral" } } } as const;

/**
 * Un mensaje al Director. El navegador manda sólo el mensaje nuevo; la conversación se
 * lee de la base, así nadie puede reescribir lo que el Director dijo antes.
 */
export async function POST(request: Request) {
  const account = await getAccountContext();
  if (!account?.workspace) return failure(401, "Tu sesión venció. Volvé a iniciar sesión.");
  const workspaceId = account.workspace.id;

  const body = await request.json().catch(() => null);
  const chatId = typeof body?.id === "string" && UUID.test(body.id) ? body.id : null;
  const message = readUserMessage(body?.message);
  // Las fechas ("hoy", "el Reel del 19") se leen en la zona del creador, que informa su navegador.
  const timeZone = validTimeZone(body?.timeZone);
  if (!chatId || !message) return failure(400, "No pudimos leer el mensaje.");

  const balance = await getCreditBalance(workspaceId);
  if (balance.remaining <= 0) {
    return failure(402, "Usaste todos los créditos de este mes. Se renuevan el primer día del mes que viene.");
  }

  const supabase = await createClient();
  const { data: existing } = await supabase.from("director_chats").select("id, title").eq("id", chatId).maybeSingle();
  if (!existing) {
    const { error } = await supabase.from("director_chats").insert({ id: chatId, workspace_id: workspaceId, user_id: account.userId });
    // Un id ajeno choca con RLS o con la clave: no se continúa sobre un chat que no es propio.
    if (error) return failure(403, "No encontramos ese chat.");
  }

  const admin = createAdminClient();
  const { data: stored } = await admin
    .from("director_messages")
    .select("id, role, parts")
    .eq("chat_id", chatId)
    .order("created_at");
  // Lo guardado lo escribió este servidor; se valida la forma, no cada herramienta.
  const messages = await validateUIMessages({ messages: [...((stored ?? []) as UIMessage[]), message] });

  const dna = await getBrandDna(workspaceId);
  const system: SystemModelMessage = {
    role: "system",
    content: buildDirectorSystem(dna, account.instagram?.username ?? null),
    providerOptions: CACHE,
  };
  const startedAt = Date.now();
  const tools: ToolSet = { ...buildAccountTools(workspaceId, timeZone), ...guideTools };

  const result = streamText({
    model: anthropic(DIRECTOR_MODEL),
    // La fecha va aparte y después de lo cacheado: si estuviera adentro, rompería la caché cada día.
    system: [system, { role: "system", content: `Hoy es ${today(timeZone)} (zona horaria del creador: ${timeZone}).` }],
    messages: await convertToModelMessages(historyForModel(messages), { tools }),
    tools,
    // Cada paso vuelve a leer la conversación: pocos pasos, para que el costo no se dispare.
    stopWhen: stepCountIs(5),
    maxOutputTokens: 8000,
  });
  // Aunque se cierre la pestaña, la respuesta termina y se guarda con su costo.
  result.consumeStream();

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    generateMessageId: generateId,
    onFinish: async ({ responseMessage }) => {
      // Lo que escribió el creador se guarda siempre; la respuesta, sólo si tiene texto.
      await admin.from("director_messages").upsert(
        [row(chatId, message, startedAt), ...(hasAnswerText(responseMessage) ? [row(chatId, responseMessage, startedAt + 1)] : [])],
        { onConflict: "id" },
      );
      await admin.from("director_chats").update({ updated_at: new Date().toISOString() }).eq("id", chatId);
      // Si el modelo falló no hay uso que leer; lo que sí se consumió queda en la consola de Anthropic.
      const usage = await Promise.resolve(result.totalUsage).catch(() => null);
      if (usage) {
        await recordAiUsage({ workspaceId, userId: account.userId, feature: "director_chat", model: DIRECTOR_MODEL, usage, referenceId: chatId });
      }
      if (!existing?.title) await nameChat(chatId, workspaceId, account.userId, message);
    },
    onError: () => "El Director no pudo responder. Probá de nuevo en un momento.",
  });
}

/**
 * Leer una guía del índice. El modelo sólo puede elegir entre esos nombres, y el lector abre
 * únicamente archivos de la carpeta de guías: no hay forma de pedirle al servidor otro
 * archivo, ni variables de entorno, ni claves. Las demás herramientas leen la cuenta.
 */
const guideTools: ToolSet = DIRECTOR_GUIDES.length > 0
  ? {
      consultar_guia: tool({
        description: "Lee una guía de Zenovi antes de responder un pedido que la necesita.",
        inputSchema: jsonSchema<{ tema: string }>({
          type: "object",
          properties: { tema: { type: "string", enum: DIRECTOR_GUIDES.map((guide) => guide.slug) } },
          required: ["tema"],
          additionalProperties: false,
        }),
        execute: async ({ tema }) => (await readDirectorGuide(tema)) ?? "Esa guía no existe.",
      }),
    }
  : {};

/** Un título corto a partir del primer mensaje, con el modelo rápido. */
async function nameChat(chatId: string, workspaceId: string, userId: string, message: UIMessage) {
  try {
    const { text, usage } = await generateText({
      model: anthropic(UTILITY_MODEL),
      prompt: `Escribí un título de 2 a 6 palabras, en español, sin comillas ni punto final, para una conversación que empieza con este mensaje:\n\n${textOf(message).slice(0, 1000)}`,
      maxOutputTokens: 30,
    });
    const title = text.replace(/["“”.]/g, "").trim().slice(0, 120);
    if (title) await createAdminClient().from("director_chats").update({ title }).eq("id", chatId);
    await recordAiUsage({ workspaceId, userId, feature: "director_title", model: UTILITY_MODEL, usage, referenceId: chatId });
  } catch {
    // Sin título el chat sigue funcionando: se muestra como "Chat nuevo".
  }
}

function today(timeZone: string) {
  return new Intl.DateTimeFormat("es-UY", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone }).format(new Date());
}

function readUserMessage(value: unknown): UIMessage | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as UIMessage;
  if (candidate.role !== "user") return null;
  if (!Array.isArray(candidate.parts) || candidate.parts.length === 0) return null;
  // Por ahora sólo texto: los adjuntos llegan en otra fase y con su propio control.
  if (!candidate.parts.every((part) => part.type === "text" && typeof part.text === "string")) return null;
  const text = textOf(candidate).trim();
  if (!text || text.length > MAX_MESSAGE_CHARACTERS) return null;
  // El id lo pone el servidor: los mensajes se guardan con la clave de servicio, y un id
  // elegido por el navegador podría pisar un mensaje de otra conversación.
  return { id: generateId(), role: "user", parts: [{ type: "text", text }] };
}

function textOf(message: UIMessage) {
  return message.parts.map((part) => (part.type === "text" ? part.text : "")).join("\n");
}

function row(chatId: string, message: UIMessage, at: number) {
  return { id: message.id, chat_id: chatId, role: message.role, parts: message.parts, created_at: new Date(at).toISOString() };
}

function failure(status: number, message: string) {
  return Response.json({ error: message }, { status });
}
