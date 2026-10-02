"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type ComponentProps } from "react";
import { Streamdown, type Components } from "streamdown";
import { CollapseSidebarIcon } from "@/components/shell/icons";
import { useShellIdentity } from "@/components/shell/shell-identity";
import type { DirectorChatSummary } from "@/lib/data/director-chats";
import { ChatList } from "./chat-list";
import { rateDirectorAnswer, type AnswerRating, type DirectorPieceOption } from "@/app/(dashboard)/director/actions";
import Link from "next/link";
import { Check, Copy, Plus, ThumbsDown, ThumbsUp } from "lucide-react";
import { HoverLabel } from "@/components/ui/hover-label";
import { DirectorComposer, ThinkingIndicator } from "./director-composer";

const creditFormatter = new Intl.NumberFormat("es-UY", { maximumFractionDigits: 0 });

export function DirectorScreen({
  chatId,
  isNew,
  initialMessages,
  initialRatings,
  brandDnaShare,
  chats,
}: {
  chatId: string;
  /** Todavía sin mensajes: existe en la base recién con el primero. */
  isNew: boolean;
  initialMessages: UIMessage[];
  initialRatings: Record<string, AnswerRating>;
  /** Qué parte del ADN de marca está completa, de 0 a 1: sin ADN, el Director no conoce el negocio. */
  brandDnaShare: number;
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
      prepareSendMessagesRequest: ({ id: requestId, messages: all }) => ({ body: { id: requestId, message: all.at(-1) } }),
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

  function send(text: string, piece: DirectorPieceOption | null) {
    setErrorMessage(null);
    // La pieza viaja como un enlace al principio del mensaje: el Director la abre con ver_pieza,
    // que sólo la encuentra dentro de la biblioteca propia.
    const body = text || "¿Qué ves en esta pieza?";
    sendMessage({ text: piece ? `[${piece.label}](${piece.href})\n\n${body}` : body });
  }

  const composer = (
    <DirectorComposer
      onSend={send}
      busy={busy}
      showSuggestions={empty}
      creditsLabel={credits.remaining > 0 ? `Te quedan ${creditFormatter.format(credits.remaining)} créditos` : "Sin créditos este mes"}
    />
  );

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] min-h-0">
      <section className="font-reading relative flex min-w-0 flex-1 flex-col overflow-hidden" aria-label="Conversación con el Director">
        {empty ? (
          <div className="relative flex flex-1 items-center justify-center overflow-y-auto px-6 py-10">
            <motion.div
              className="relative z-10 w-full max-w-2xl space-y-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className="space-y-3 text-center">
                <motion.div className="inline-block" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
                  <h1 className="bg-gradient-to-r from-ink/90 to-ink/40 bg-clip-text pb-1 text-3xl font-medium tracking-tight text-transparent">
                    ¿En qué te ayudo hoy?
                  </h1>
                  <motion.div
                    className="h-px bg-gradient-to-r from-transparent via-ink/15 to-transparent"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "100%", opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                  />
                </motion.div>
                <motion.p className="text-sm text-ink/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                  Pedí ideas, guiones o un plan, o escribí / para ver los comandos
                </motion.p>
              </div>
              {brandDnaShare < 0.5 ? <BrandDnaNotice share={brandDnaShare} /> : null}
              {composer}
              {errorMessage ? <ErrorNotice message={errorMessage} /> : null}
            </motion.div>
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
    return (
      <div className="flex flex-col items-end gap-1.5">
        {piece ? <AnswerLink href={piece.href}>{piece.label}</AnswerLink> : null}
        <p className="max-w-[80%] whitespace-pre-wrap rounded-2xl bg-canvas px-4 py-2.5 text-[15px] leading-6 text-ink">{body}</p>
      </div>
    );
  }
  // Todavía consultando la cuenta o las guías: se dice qué, en el lugar de la respuesta.
  if (!text) {
    if (!streaming) return null;
    return consulted.pending ? <ThinkingIndicator label={consulted.pending} /> : <ThinkingIndicator />;
  }
  return (
    <div className="group/answer">
      <div className="director-answer rounded-2xl border border-mist bg-paper px-5 py-4 text-[15px] leading-7 text-ink">
        {consulted.done.length ? <p className="mb-2 text-[12px] text-muted">{consulted.done.join(" · ")}</p> : null}
        <Streamdown isAnimating={streaming} components={ANSWER_COMPONENTS}>{text}</Streamdown>
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
        className="group/tip relative grid size-8 place-items-center rounded-control text-graphite hover:bg-ink/[0.045] hover:text-ink"
      >
        <CollapseSidebarIcon className="size-4 -scale-x-100 rotate-180" />
        <HoverLabel side="left">Mostrar chats</HoverLabel>
      </button>
      <Link
        href="/director"
        aria-label="Chat nuevo"
        className="group/tip relative grid size-8 place-items-center rounded-control text-graphite hover:bg-ink/[0.045] hover:text-ink"
      >
        <Plus className="size-4" strokeWidth={1.75} />
        <HoverLabel side="left">Chat nuevo</HoverLabel>
      </Link>
    </aside>
  );
}

const TOOL_LABELS: Record<string, { pending: string; done: string }> = {
  "tool-buscar_contenido": { pending: "Revisando tu contenido…", done: "Revisó tu contenido" },
  "tool-ver_pieza": { pending: "Mirando la pieza en detalle…", done: "Miró una pieza en detalle" },
  "tool-resumen_cuenta": { pending: "Revisando el resumen de tu cuenta…", done: "Revisó el resumen de tu cuenta" },
  "tool-consultar_guia": { pending: "Consultando las guías de Zenovi…", done: "Consultó las guías de Zenovi" },
};

/** Qué consultó el Director para responder: lo que está haciendo ahora y lo que ya leyó. */
function consultedSources(message: UIMessage) {
  const tools = message.parts.filter((part) => part.type in TOOL_LABELS) as Array<{ type: string; state?: string }>;
  const running = tools.findLast((part) => part.state !== "output-available" && part.state !== "output-error");
  return {
    pending: running ? TOOL_LABELS[running.type].pending : null,
    done: [...new Set(tools.filter((part) => part.state === "output-available").map((part) => TOOL_LABELS[part.type].done))],
  };
}

const ATTACHED_PIECE = /^\[([^\]]+)\]\((\/content\/[^)\s]+)\)\n\n/;

/** Una pieza adjuntada desde el "+" llega como enlace al principio del mensaje. */
function splitAttachedPiece(text: string) {
  const match = ATTACHED_PIECE.exec(text);
  return match ? { piece: { label: match[1], href: match[2] }, body: text.slice(match[0].length) } : { piece: null, body: text };
}

/** Una pieza citada por el Director es un chip que la abre; un enlace externo se abre aparte. */
function AnswerLink({ href, children }: ComponentProps<"a">) {
  if (href?.startsWith("/content/")) {
    return (
      <Link
        href={href}
        className="inline-flex items-center rounded-full border border-mist bg-canvas px-2 py-0.5 text-[13px] font-medium text-ink no-underline transition-colors hover:border-mist-strong hover:bg-paper"
      >
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-ink underline underline-offset-2">
      {children}
    </a>
  );
}

// `Components` de streamdown suma una firma genérica por clave que ningún componente tipado
// cumple; el mapa se declara con su tipo para que `a` reciba las props de un enlace.
const ANSWER_COMPONENTS = { a: AnswerLink } as Components;

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
      className={`group/tip relative grid size-8 place-items-center rounded-control transition-colors hover:bg-ink/[0.045] ${active ? "text-ink" : "text-graphite hover:text-ink"}`}
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
  return <p role="alert" className="rounded-control border border-danger/20 bg-danger/5 px-3 py-2 text-[13px] text-danger">{message}</p>;
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
