"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Streamdown } from "streamdown";
import { useShellIdentity } from "@/components/shell/shell-identity";
import type { DirectorChatSummary } from "@/lib/data/director-chats";
import { ChatList } from "./chat-list";
import { AmbientGlow, DirectorComposer, ThinkingIndicator } from "./director-composer";

const creditFormatter = new Intl.NumberFormat("es-UY", { maximumFractionDigits: 0 });

export function DirectorScreen({
  chatId,
  initialMessages,
  chats,
}: {
  /** Null en un chat nuevo: el id se crea en el navegador y el servidor lo adopta al primer mensaje. */
  chatId: string | null;
  initialMessages: UIMessage[];
  chats: DirectorChatSummary[];
}) {
  const router = useRouter();
  const { credits } = useShellIdentity();
  const [id] = useState(() => chatId ?? crypto.randomUUID());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    id,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/director/chat",
      // Sólo el mensaje nuevo: la conversación la lee el servidor de la base.
      prepareSendMessagesRequest: ({ id: requestId, messages: all }) => ({ body: { id: requestId, message: all.at(-1) } }),
    }),
    onFinish: () => {
      // El chat nuevo pasa a tener su dirección, y la lista y el círculo de créditos se actualizan.
      if (!chatId) router.replace(`/director/${id}`);
      router.refresh();
    },
    onError: (error) => setErrorMessage(readError(error)),
  });

  const busy = status === "submitted" || status === "streaming";
  const empty = messages.length === 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, status]);

  function send(text: string) {
    setErrorMessage(null);
    sendMessage({ text });
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
      <section className="relative flex min-w-0 flex-1 flex-col overflow-hidden" aria-label="Conversación con el Director">
        <AmbientGlow />
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
              {composer}
              {errorMessage ? <ErrorNotice message={errorMessage} /> : null}
            </motion.div>
          </div>
        ) : (
          <>
            <div className="relative min-h-0 flex-1 overflow-y-auto px-5 py-8">
              <div className="mx-auto w-full max-w-3xl space-y-6">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} streaming={status === "streaming" && message.id === messages.at(-1)?.id} />
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
      <ChatList chats={chats} activeChatId={chatId} />
    </div>
  );
}

function ChatMessage({ message, streaming }: { message: UIMessage; streaming: boolean }) {
  const text = message.parts.map((part) => (part.type === "text" ? part.text : "")).join("");
  const consulted = message.parts.some((part) => part.type === "tool-consultar_guia");
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[80%] whitespace-pre-wrap rounded-2xl bg-canvas px-4 py-2.5 text-[15px] leading-6 text-ink">{text}</p>
      </div>
    );
  }
  return (
    <div className="director-answer text-[15px] leading-7 text-ink">
      {consulted ? <p className="font-support mb-2 text-[12px] text-muted">Consultó las guías de Zenovi</p> : null}
      <Streamdown isAnimating={streaming}>{text}</Streamdown>
    </div>
  );
}

function ErrorNotice({ message }: { message: string }) {
  return <p role="alert" className="font-support rounded-control border border-danger/20 bg-danger/5 px-3 py-2 text-[13px] text-danger">{message}</p>;
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
