"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type FileUIPart, type UIMessage } from "ai";
import { AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { CollapseSidebarIcon } from "@/components/shell/icons";
import { useShellIdentity } from "@/components/shell/shell-identity";
import type { DirectorChatSummary } from "@/lib/data/director-chats";
import { ChatList } from "./chat-list";
import { rateDirectorAnswer, type AnswerRating, type DirectorPieceOption } from "@/app/(dashboard)/director/actions";
import Link from "next/link";
import { AnswerLink } from "./answer-link";
import { Check, Copy, Plus, ThumbsDown, ThumbsUp } from "lucide-react";
import { HoverLabel } from "@/components/ui/hover-label";
import { DirectorComposer, ThinkingIndicator } from "./director-composer";
import { SentAttachment } from "./attachments";
import { IdeaCard } from "./idea-card";
import { REFUSAL_ANSWER } from "@/lib/director/history";
import type { ProposedIdea } from "@/lib/director/idea-tool";
import { Notice } from "@/components/ui/notice";
import { CREDIT_LOCK_MESSAGES } from "@/lib/credits/pricing";

// Los chats guardados llegan con las respuestas ya armadas desde el servidor; en un chat
// nuevo el lector de Markdown se pide al mandar el primer mensaje, mientras el Director piensa.
const loadAnswerMarkdown = () => import("./answer-markdown");
const AnswerMarkdown = dynamic(loadAnswerMarkdown);

const creditFormatter = new Intl.NumberFormat("es-UY", { maximumFractionDigits: 0 });

export function DirectorScreen({
  chatId,
  isNew,
  initialMessages,
  initialRatings,
  brandDnaShare,
  initialPiece,
  initialText,
  chats,
}: {
  chatId: string;
  /** Todavía sin mensajes: existe en la base recién con el primero. */
  isNew: boolean;
  initialMessages: UIMessage[];
  initialRatings: Record<string, AnswerRating>;
  /** Qué parte del ADN de marca está completa, de 0 a 1: sin ADN, el Director no conoce el negocio. */
  brandDnaShare: number;
  /** Lo que trae quien llega desde una pieza o una tarjeta de Producción. */
  initialPiece: DirectorPieceOption | null;
  initialText: string;
  chats: DirectorChatSummary[];
}) {
  const router = useRouter();
  const { credits } = useShellIdentity();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [chatsOpen, setChatsOpen] = useChatsPanelPreference();
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    id: chatId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/director/chat",
      // Sólo el mensaje nuevo: la conversación la lee el servidor de la base.
      prepareSendMessagesRequest: ({ id: requestId, messages: all }) => ({
        body: { id: requestId, message: all.at(-1), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      }),
    }),
    onFinish: () => {
      // Sólo cambia la dirección: es la misma página, así que no hay navegación que pueda
      // quedar a medio camino. Un refresco trae la lista de chats y el saldo al día.
      if (isNew) window.history.replaceState(null, "", `/director/${chatId}`);
      router.refresh();
    },
    onError: (error) => setErrorMessage(readError(error)),
  });

  const busy = status === "submitted" || status === "streaming";
  const empty = messages.length === 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, status]);

  function send(text: string, piece: DirectorPieceOption | null, files: FileUIPart[]) {
    setErrorMessage(null);
    void loadAnswerMarkdown();
    // La pieza viaja como un enlace al principio del mensaje: el Director la abre con ver_pieza,
    // que sólo la encuentra dentro de la biblioteca propia.
    const body = text || (piece ? "¿Qué ves en esta pieza?" : "");
    sendMessage({ text: piece ? `[${piece.label}](${piece.href})\n\n${body}` : body, files });
  }

  const composer = (
    <DirectorComposer
      onSend={send}
      busy={busy}
      showSuggestions={empty}
      initialPiece={initialPiece}
      initialText={initialText}
      creditsLabel={credits.locked ? CREDIT_LOCK_MESSAGES[credits.locked] : credits.remaining > 0 ? `Te quedan ${creditFormatter.format(credits.remaining)} créditos` : "Sin créditos este mes"}
    />
  );

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] min-h-0">
      <section className="relative flex min-w-0 flex-1 flex-col overflow-hidden" aria-label="Conversación con el Director">
        {empty ? (
          <div className="relative flex flex-1 items-center justify-center overflow-y-auto px-6 py-10">
            <div className="rise-in relative z-10 w-full max-w-2xl space-y-12">
              <div className="space-y-3 text-center">
                <div className="rise-in inline-block [--rise-from:10px] [animation-delay:200ms]">
                  <h1 className="pb-1 text-3xl font-semibold tracking-tight text-ink">
                    ¿En qué te ayudo hoy?
                  </h1>
                  <div className="line-grow h-px bg-gradient-to-r from-transparent via-ink/15 to-transparent" />
                </div>
                <p className="rise-in text-sm text-graphite [--rise-from:0px] [animation-delay:300ms]">
                  Pedí ideas, guiones o un plan, o escribí / para ver los comandos
                </p>
              </div>
              {brandDnaShare < 0.5 ? <BrandDnaNotice share={brandDnaShare} /> : null}
              {composer}
              {errorMessage ? <ErrorNotice message={errorMessage} /> : null}
            </div>
          </div>
        ) : (
          <>
            <div className="relative min-h-0 flex-1 overflow-y-auto px-5 py-8">
              <div className="mx-auto w-full max-w-3xl space-y-6">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    streaming={busy && message.id === messages.at(-1)?.id}
                    initialRating={initialRatings[message.id] ?? null}
                  />
                ))}
                <AnimatePresence>{status === "submitted" ? <ThinkingIndicator key="thinking" /> : null}</AnimatePresence>
                {errorMessage ? <ErrorNotice message={errorMessage} /> : null}
                <div ref={bottomRef} />
              </div>
            </div>
            <div className="relative px-5 pb-5 pt-2">
              <div className="mx-auto w-full max-w-3xl">{composer}</div>
            </div>
          </>
        )}
      </section>
      {chatsOpen ? (
        <ChatList chats={chats} activeChatId={isNew ? null : chatId} onClose={() => setChatsOpen(false)} />
      ) : (
        <ChatRail onOpen={() => setChatsOpen(true)} />
      )}
    </div>
  );
}

function ChatMessage({
  message,
  streaming,
  initialRating,
}: {
  message: UIMessage;
  streaming: boolean;
  initialRating: AnswerRating | null;
}) {
  const text = message.parts.map((part) => (part.type === "text" ? part.text : "")).join("");
  const consulted = consultedSources(message);
  if (message.role === "user") {
    const { piece, body } = splitAttachedPiece(text);
    const files = message.parts.filter((part): part is FileUIPart => part.type === "file");
    return (
      <div className="flex flex-col items-end gap-1.5">
        {files.length ? (
          <div className="flex max-w-[80%] flex-wrap justify-end gap-2">
            {files.map((file) => <SentAttachment key={file.url} part={file} />)}
          </div>
        ) : null}
        {piece ? <AnswerLink href={piece.href}>{piece.label}</AnswerLink> : null}
        {body ? (
          <p className="max-w-[80%] whitespace-pre-wrap rounded-2xl bg-canvas px-4 py-2.5 text-[15px] leading-6 text-ink">{body}</p>
        ) : null}
      </div>
    );
  }
  const ideas = proposedIdeas(message);
  // Todavía consultando la cuenta o las guías: se dice qué, en el lugar de la respuesta.
  // Cortada por el filtro de seguridad: se muestra la misma frase que queda guardada.
  if (!text && ideas.length === 0 && !streaming && (message.metadata as { finishReason?: string } | undefined)?.finishReason === "content-filter") {
    return <div className="director-answer rounded-2xl border border-mist bg-paper px-5 py-4 text-[15px] leading-7 text-ink">{REFUSAL_ANSWER}</div>;
  }
  if (!text && ideas.length === 0) {
    if (!streaming) return null;
    return consulted.pending ? <ThinkingIndicator label={consulted.pending} /> : <ThinkingIndicator />;
  }
  return (
    <div className="group/answer">
      <div className="director-answer rounded-2xl border border-mist bg-paper px-5 py-4 text-[15px] leading-7 text-ink">
        {consulted.done.length ? <p className="mb-2 text-[12px] text-muted">{consulted.done.join(" · ")}</p> : null}
        {text ? <AnswerMarkdown text={text} streaming={streaming} /> : null}
        {ideas.map((idea) => (
          <IdeaCard key={idea.toolCallId} messageId={message.id} toolCallId={idea.toolCallId} idea={idea.input} savedItemId={idea.savedItemId} />
        ))}
      </div>
      {streaming ? null : <AnswerActions messageId={message.id} text={text} initialRating={initialRating} />}
    </div>
  );
}

/** Con los chats cerrados queda una barra angosta, como la lateral de la izquierda. */
function ChatRail({ onOpen }: { onOpen: () => void }) {
  return (
    <aside className="hidden w-[60px] shrink-0 flex-col items-center gap-1 border-l border-mist bg-paper py-3 lg:flex" aria-label="Chats">
      <button
        type="button"
        onClick={onOpen}
        aria-label="Mostrar chats"
        className="group/tip relative grid size-8 place-items-center rounded-control text-ink hover:bg-ink/[0.045]"
      >
        <CollapseSidebarIcon className="size-4 -scale-x-100 rotate-180" />
        <HoverLabel side="left">Mostrar chats</HoverLabel>
      </button>
      <Link
        href="/director"
        aria-label="Chat nuevo"
        className="group/tip relative grid size-8 place-items-center rounded-control text-ink hover:bg-ink/[0.045]"
      >
        <Plus className="size-4" strokeWidth={1.75} />
        <HoverLabel side="left">Chat nuevo</HoverLabel>
      </Link>
    </aside>
  );
}

/** Las ideas que el Director propuso en esta respuesta, ya completas, y si se guardaron. */
function proposedIdeas(message: UIMessage) {
  return message.parts.flatMap((part) => {
    if (part.type !== "tool-proponer_idea") return [];
    const call = part as unknown as { toolCallId: string; state?: string; input?: ProposedIdea; output?: { guardada?: string } };
    return call.input && (call.state === "output-available" || call.state === undefined)
      ? [{ toolCallId: call.toolCallId, input: call.input, savedItemId: call.output?.guardada ?? null }]
      : [];
  });
}

const TOOL_LABELS: Record<string, { pending: string; done: string }> = {
  "tool-buscar_contenido": { pending: "Revisando tu contenido…", done: "Revisó tu contenido" },
  "tool-ver_pieza": { pending: "Mirando la pieza en detalle…", done: "Miró una pieza en detalle" },
  "tool-ver_historias": { pending: "Revisando tus Historias…", done: "Revisó tus Historias" },
  "tool-resumen_cuenta": { pending: "Revisando el resumen de tu cuenta…", done: "Revisó el resumen de tu cuenta" },
  "tool-consultar_guia": { pending: "Consultando las guías de Zenovi…", done: "Consultó las guías de Zenovi" },
  "tool-proponer_idea": { pending: "Armando la idea…", done: "" },
};

/** Qué consultó el Director para responder: lo que está haciendo ahora y lo que ya leyó. */
function consultedSources(message: UIMessage) {
  const tools = message.parts.filter((part) => part.type in TOOL_LABELS) as Array<{ type: string; state?: string }>;
  const running = tools.findLast((part) => part.state !== "output-available" && part.state !== "output-error");
  return {
    pending: running ? TOOL_LABELS[running.type].pending : null,
    done: [...new Set(tools.filter((part) => part.state === "output-available").map((part) => TOOL_LABELS[part.type].done))].filter(Boolean),
  };
}

const ATTACHED_PIECE = /^\[([^\]]+)\]\((\/content\/[^)\s]+)\)\n\n/;

/** Una pieza adjuntada desde el "+" llega como enlace al principio del mensaje. */
function splitAttachedPiece(text: string) {
  const match = ATTACHED_PIECE.exec(text);
  return match ? { piece: { label: match[1], href: match[2] }, body: text.slice(match[0].length) } : { piece: null, body: text };
}


/** Copiar y calificar, debajo de cada respuesta terminada. */
function AnswerActions({ messageId, text, initialRating }: { messageId: string; text: string; initialRating: AnswerRating | null }) {
  const [copied, setCopied] = useState(false);
  const [rating, setRating] = useState<AnswerRating | null>(initialRating);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Sin permiso de portapapeles: no hay nada que mostrar.
    }
  }

  function rate(next: AnswerRating) {
    // Tocar la misma calificación otra vez la quita.
    const value = rating === next ? null : next;
    setRating(value);
    void rateDirectorAnswer(messageId, value);
  }

  return (
    <div className="mt-1.5 flex items-center gap-0.5 pl-1">
      <ActionButton label={copied ? "Copiado" : "Copiar"} onClick={copy}>
        {copied ? <Check className="size-4" strokeWidth={1.7} /> : <Copy className="size-4" strokeWidth={1.7} />}
      </ActionButton>
      <ActionButton label="Me sirvió" onClick={() => rate("up")} active={rating === "up"}>
        <ThumbsUp className="size-4" strokeWidth={1.7} fill={rating === "up" ? "currentColor" : "none"} />
      </ActionButton>
      <ActionButton label="No me sirvió" onClick={() => rate("down")} active={rating === "down"}>
        <ThumbsDown className="size-4" strokeWidth={1.7} fill={rating === "down" ? "currentColor" : "none"} />
      </ActionButton>
    </div>
  );
}

/** Ícono con tooltip propio, blanco y al instante, como el resto de Zenovi. */
function ActionButton({
  label,
  onClick,
  active = false,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`group/tip relative grid size-8 place-items-center rounded-control text-ink transition-colors hover:bg-ink/[0.045] ${active ? "bg-ink/[0.06]" : ""}`}
    >
      {children}
      <HoverLabel>{label}</HoverLabel>
    </button>
  );
}

const CHATS_PANEL_KEY = "zenovi.director.chatsOpen";
const chatsPanelListeners = new Set<() => void>();
/** Si el navegador no deja guardar (modo privado), la preferencia vive sólo mientras dura la página. */
let chatsPanelMemory: boolean | null = null;

function readChatsPanel() {
  try {
    const stored = window.localStorage.getItem(CHATS_PANEL_KEY);
    if (stored !== null) return stored !== "false";
  } catch {
    // Sin almacenamiento: se usa lo que quedó en memoria.
  }
  return chatsPanelMemory ?? true;
}

function subscribeChatsPanel(listener: () => void) {
  chatsPanelListeners.add(listener);
  return () => {
    chatsPanelListeners.delete(listener);
  };
}

/** Abierto o cerrado, recordado en este navegador. En el servidor y sin dato, abierto. */
function useChatsPanelPreference() {
  const open = useSyncExternalStore(subscribeChatsPanel, readChatsPanel, () => true);

  function update(next: boolean) {
    chatsPanelMemory = next;
    try {
      window.localStorage.setItem(CHATS_PANEL_KEY, String(next));
    } catch {
      // Igual cambia en pantalla; sólo no se recuerda al volver.
    }
    chatsPanelListeners.forEach((listener) => listener());
  }

  return [open, update] as const;
}

/** Sin ADN, el Director responde en general; con él, habla del negocio de cada creador. */
function BrandDnaNotice({ share }: { share: number }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-mist bg-paper px-4 py-3">
      <p className="text-[13px] leading-5 text-graphite">
        <span className="font-medium text-ink">El Director todavía no conoce tu marca.</span>{" "}
        Completá tu ADN ({Math.round(share * 100)} % hecho).
      </p>
      <Link
        href="/brand"
        className="shrink-0 rounded-full bg-ink px-3.5 py-1.5 text-[12px] font-medium text-paper hover:bg-ink/85"
      >
        Completar ADN
      </Link>
    </div>
  );
}

function ErrorNotice({ message }: { message: string }) {
  return <Notice>{message}</Notice>;
}

/** El servidor responde los errores esperables como `{ error }`; el resto se dice en general. */
function readError(error: Error) {
  try {
    const parsed = JSON.parse(error.message) as { error?: unknown };
    if (typeof parsed.error === "string") return parsed.error;
  } catch {
    // No era JSON: un corte de red o un error del proveedor.
  }
  return "El Director no pudo responder. Probá de nuevo en un momento.";
}
